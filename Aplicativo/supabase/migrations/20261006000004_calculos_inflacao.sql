-- Cálculos de inflação (regras C1, C2, C3 e C6 de Documentacao/regras-de-negocio.md).
-- Fonte única dos números: painel, relatório, assistente e site usam estas funções.
-- Acumulados sempre por produto: (∏(1 + v/100) − 1) × 100 — nunca soma de taxas.

-- Quantidade de meses entre dois meses, incluindo as duas pontas.
create function public.meses_entre(p_inicio date, p_fim date)
returns integer
language sql
immutable
set search_path = ''
as $$
  select ((extract(year from p_fim) * 12 + extract(month from p_fim))
        - (extract(year from p_inicio) * 12 + extract(month from p_inicio)) + 1)::integer
$$;

-- C2: acumulado de uma série mensal no período. Retorna null se faltar algum mês
-- (dado ainda não publicado) — nunca estima.
create function public.acumulado_mensal(p_codigo text, p_inicio date, p_fim date)
returns numeric
language sql
stable
set search_path = ''
as $$
  with v as (
    select iv.valor
    from public.indicadores_valores iv
    where iv.indicador_codigo = p_codigo
      and iv.data_referencia between date_trunc('month', p_inicio)::date and date_trunc('month', p_fim)::date
  )
  select case
    when count(*) > 0 and count(*) = public.meses_entre(p_inicio, p_fim)
      then round((exp(sum(ln(1 + v.valor / 100))) - 1) * 100, 6)
  end
  from v
$$;

-- Último mês publicado de uma série mensal até a data informada.
create function public.ultimo_mes_publicado(p_codigo text, p_ate date)
returns date
language sql
stable
set search_path = ''
as $$
  select max(iv.data_referencia)
  from public.indicadores_valores iv
  where iv.indicador_codigo = p_codigo and iv.data_referencia <= p_ate
$$;

-- C1 + C3: série mensal dos índices de inflação ativos com acumulado no ano e em 12 meses.
create function public.serie_inflacao(p_inicio date, p_fim date)
returns table (
  indicador_codigo text,
  data_referencia date,
  valor numeric,
  acumulado_ano numeric,
  acumulado_12m numeric
)
language sql
stable
set search_path = ''
as $$
  with base as (
    select iv.indicador_codigo, iv.data_referencia, iv.valor, ln(1 + iv.valor / 100) as l
    from public.indicadores_valores iv
    join public.indicadores i on i.codigo = iv.indicador_codigo
    where i.tipo = 'inflacao' and i.ativo
      and iv.data_referencia between (date_trunc('month', p_inicio) - interval '11 months')::date and p_fim
  ),
  janelas as (
    select b.*,
      sum(b.l) over w12 as soma_12m, count(*) over w12 as n_12m,
      sum(b.l) over w_ano as soma_ano, count(*) over w_ano as n_ano
    from base b
    window
      w12 as (partition by b.indicador_codigo order by b.data_referencia
              range between interval '11 months' preceding and current row),
      w_ano as (partition by b.indicador_codigo, extract(year from b.data_referencia)
                order by b.data_referencia)
  )
  select j.indicador_codigo, j.data_referencia, j.valor,
    case when j.n_ano = extract(month from j.data_referencia) then round((exp(j.soma_ano) - 1) * 100, 6) end,
    case when j.n_12m = 12 then round((exp(j.soma_12m) - 1) * 100, 6) end
  from janelas j
  where j.data_referencia >= date_trunc('month', p_inicio)::date
  order by j.indicador_codigo, j.data_referencia
$$;

-- Resumo por índice de inflação: último mês publicado até p_fim e acumulados.
-- acumulado_periodo vai do início do período até o último mês publicado (periodo_ate).
create function public.resumo_inflacao(p_inicio date, p_fim date)
returns table (
  indicador_codigo text,
  ultima_data date,
  valor_mes numeric,
  acumulado_ano numeric,
  acumulado_12m numeric,
  acumulado_periodo numeric,
  periodo_ate date
)
language sql
stable
set search_path = ''
as $$
  select i.codigo, u.ultima, s.valor, s.acumulado_ano, s.acumulado_12m,
    case when u.ultima >= date_trunc('month', p_inicio)::date
      then public.acumulado_mensal(i.codigo, p_inicio, u.ultima) end,
    u.ultima
  from public.indicadores i
  cross join lateral (select public.ultimo_mes_publicado(i.codigo, p_fim) as ultima) u
  left join lateral (
    select si.valor, si.acumulado_ano, si.acumulado_12m
    from public.serie_inflacao(u.ultima, u.ultima) si
    where si.indicador_codigo = i.codigo
  ) s on true
  where i.tipo = 'inflacao' and i.ativo
  order by i.ordem
$$;

-- C6: IPCA 12 meses frente à meta do ano do último mês publicado.
create function public.status_meta_inflacao(p_data date)
returns table (
  data_referencia date,
  ipca_12m numeric,
  ano smallint,
  centro numeric,
  piso numeric,
  teto numeric,
  distancia_centro numeric,
  status text
)
language sql
stable
set search_path = ''
as $$
  with ref as (
    select public.ultimo_mes_publicado('ipca', p_data) as mes
  ),
  calc as (
    select ref.mes,
      public.acumulado_mensal('ipca', (ref.mes - interval '11 months')::date, ref.mes) as ipca_12m,
      m.ano, m.centro, m.centro - m.tolerancia as piso, m.centro + m.tolerancia as teto
    from ref
    left join public.metas_inflacao m on m.ano = extract(year from ref.mes)
    where ref.mes is not null
  )
  select c.mes, c.ipca_12m, c.ano, c.centro, c.piso, c.teto,
    round(c.ipca_12m - c.centro, 6),
    case
      when c.ipca_12m is null then 'sem_dados'
      when c.centro is null then 'meta_nao_cadastrada'
      when c.ipca_12m < c.piso then 'abaixo_do_piso'
      when c.ipca_12m > c.teto then 'acima_do_teto'
      else 'dentro_da_meta'
    end
  from calc c
$$;
