-- Cálculos de juros e câmbio (regras C4, C5, C8 e C9 de Documentacao/regras-de-negocio.md).

-- C4: acumulado de uma série diária (% ao dia) no período, opcionalmente a X% da taxa.
create function public.acumulado_diario(p_codigo text, p_inicio date, p_fim date, p_percentual numeric default 100)
returns numeric
language sql
stable
set search_path = ''
as $$
  select case when count(*) > 0
    then round((exp(sum(ln(1 + iv.valor / 100 * p_percentual / 100))) - 1) * 100, 6) end
  from public.indicadores_valores iv
  where iv.indicador_codigo = p_codigo and iv.data_referencia between p_inicio and p_fim
$$;

-- Último valor de uma série até a data informada.
create function public.valor_em(p_codigo text, p_data date)
returns numeric
language sql
stable
set search_path = ''
as $$
  select iv.valor
  from public.indicadores_valores iv
  where iv.indicador_codigo = p_codigo and iv.data_referencia <= p_data
  order by iv.data_referencia desc
  limit 1
$$;

-- C4 + C5: resumo de juros. CDI 12m e IPCA 12m usam a mesma janela (12 meses encerrados
-- no último mês com IPCA publicado), para o juro real (Fisher) ser consistente.
create function public.resumo_juros(p_inicio date, p_fim date)
returns table (
  selic_atual numeric,
  selic_data date,
  cdi_periodo numeric,
  cdi_anualizado numeric,
  referencia_12m date,
  cdi_12m numeric,
  ipca_12m numeric,
  juro_real_12m numeric
)
language sql
stable
set search_path = ''
as $$
  with selic as (
    select iv.valor, iv.data_referencia
    from public.indicadores_valores iv
    where iv.indicador_codigo = 'selic' and iv.data_referencia <= p_fim
    order by iv.data_referencia desc limit 1
  ),
  ref as (
    select public.ultimo_mes_publicado('ipca', p_fim) as mes
  ),
  doze as (
    select ref.mes,
      public.acumulado_diario('cdi', (ref.mes - interval '11 months')::date,
                              (ref.mes + interval '1 month' - interval '1 day')::date) as cdi,
      public.acumulado_mensal('ipca', (ref.mes - interval '11 months')::date, ref.mes) as ipca
    from ref
  )
  select
    (select valor from selic), (select data_referencia from selic),
    public.acumulado_diario('cdi', p_inicio, p_fim),
    round((power(1 + public.valor_em('cdi', p_fim) / 100, 252) - 1) * 100, 6),
    d.mes, d.cdi, d.ipca,
    round(((1 + d.cdi / 100) / (1 + d.ipca / 100) - 1) * 100, 6)
  from doze d
$$;

-- C8: decisões da Selic (dias em que a meta mudou).
create function public.decisoes_selic(p_inicio date, p_fim date)
returns table (data_referencia date, anterior numeric, novo numeric, variacao_pp numeric)
language sql
stable
set search_path = ''
as $$
  with s as (
    select iv.data_referencia, iv.valor,
      lag(iv.valor) over (order by iv.data_referencia) as anterior
    from public.indicadores_valores iv
    where iv.indicador_codigo = 'selic' and iv.data_referencia <= p_fim
  )
  select s.data_referencia, s.anterior, s.valor, s.valor - s.anterior
  from s
  where s.anterior is not null and s.valor <> s.anterior and s.data_referencia >= p_inicio
  order by s.data_referencia
$$;

-- C8: ciclo atual da Selic. 'manutencao' quando a última mudança tem mais de 60 dias
-- (sem alteração em pelo menos uma reunião do Copom, que ocorrem a cada ~45 dias).
create function public.ciclo_selic(p_data date)
returns table (
  selic_atual numeric,
  direcao text,
  decisoes_seguidas integer,
  ultima_decisao date,
  ultima_variacao_pp numeric
)
language plpgsql
stable
set search_path = ''
as $$
declare
  v_decisao record;
  v_sinal numeric;
  v_contagem integer := 0;
begin
  selic_atual := public.valor_em('selic', p_data);
  for v_decisao in
    select d.data_referencia, d.variacao_pp
    from public.decisoes_selic('1990-01-01', p_data) d
    order by d.data_referencia desc
  loop
    if v_sinal is null then
      v_sinal := sign(v_decisao.variacao_pp);
      ultima_decisao := v_decisao.data_referencia;
      ultima_variacao_pp := v_decisao.variacao_pp;
    elsif sign(v_decisao.variacao_pp) <> v_sinal then
      exit;
    end if;
    v_contagem := v_contagem + 1;
  end loop;

  decisoes_seguidas := v_contagem;
  direcao := case
    when ultima_decisao is null or p_data - ultima_decisao > 60 then 'manutencao'
    when v_sinal > 0 then 'alta'
    else 'queda'
  end;
  return next;
end;
$$;

-- C4 + C5 mensais: Selic do fim do mês, CDI e IPCA do mês, índices base 100 no início
-- do período e juro real 12m mês a mês.
create function public.serie_juros_mensal(p_inicio date, p_fim date)
returns table (
  mes date,
  selic numeric,
  cdi_mes numeric,
  ipca_mes numeric,
  cdi_indice numeric,
  ipca_indice numeric,
  cdi_12m numeric,
  ipca_12m numeric,
  juro_real_12m numeric
)
language sql
stable
set search_path = ''
as $$
  with limites as (
    select date_trunc('month', p_inicio)::date as ini,
           (date_trunc('month', p_inicio) - interval '11 months')::date as ini_ext
  ),
  cdi as (
    select date_trunc('month', iv.data_referencia)::date as mes, sum(ln(1 + iv.valor / 100)) as l
    from public.indicadores_valores iv, limites
    where iv.indicador_codigo = 'cdi' and iv.data_referencia between limites.ini_ext and p_fim
    group by 1
  ),
  ipca as (
    select iv.data_referencia as mes, ln(1 + iv.valor / 100) as l
    from public.indicadores_valores iv, limites
    where iv.indicador_codigo = 'ipca' and iv.data_referencia between limites.ini_ext and p_fim
  ),
  selic as (
    select distinct on (date_trunc('month', iv.data_referencia))
      date_trunc('month', iv.data_referencia)::date as mes, iv.valor
    from public.indicadores_valores iv, limites
    where iv.indicador_codigo = 'selic' and iv.data_referencia between limites.ini_ext and p_fim
    order by date_trunc('month', iv.data_referencia), iv.data_referencia desc
  ),
  meses as (
    select c.mes, s.valor as selic, c.l as l_cdi, i.l as l_ipca,
      sum(c.l) over w12 as s_cdi_12m, count(c.l) over w12 as n_cdi_12m,
      sum(i.l) over w12 as s_ipca_12m, count(i.l) over w12 as n_ipca_12m
    from cdi c
    left join ipca i using (mes)
    left join selic s using (mes)
    window w12 as (order by c.mes range between interval '11 months' preceding and current row)
  ),
  periodo as (
    select m.*, sum(m.l_cdi) over wp as s_cdi_ac, sum(m.l_ipca) over wp as s_ipca_ac
    from meses m, limites
    where m.mes >= limites.ini
    window wp as (order by m.mes)
  )
  select p.mes, p.selic,
    round((exp(p.l_cdi) - 1) * 100, 6),
    round((exp(p.l_ipca) - 1) * 100, 6),
    round(100 * exp(p.s_cdi_ac), 4),
    case when p.l_ipca is not null then round(100 * exp(p.s_ipca_ac), 4) end,
    case when p.n_cdi_12m = 12 then round((exp(p.s_cdi_12m) - 1) * 100, 6) end,
    case when p.n_ipca_12m = 12 then round((exp(p.s_ipca_12m) - 1) * 100, 6) end,
    case when p.n_cdi_12m = 12 and p.n_ipca_12m = 12
      then round((exp(p.s_cdi_12m - p.s_ipca_12m) - 1) * 100, 6) end
  from periodo p
  order by p.mes
$$;

-- C9: estatísticas de câmbio no período e variações relativas à última cotação.
create function public.resumo_cambio(p_inicio date, p_fim date)
returns table (
  indicador_codigo text,
  ultima_data date,
  ultimo_valor numeric,
  variacao_periodo numeric,
  media numeric,
  minimo numeric,
  maximo numeric,
  volatilidade_anual numeric,
  variacao_mes numeric,
  variacao_ano numeric,
  variacao_12m numeric,
  minimo_12m numeric,
  maximo_12m numeric
)
language sql
stable
set search_path = ''
as $$
  with periodo as (
    select iv.indicador_codigo, iv.data_referencia, iv.valor,
      ln(iv.valor / lag(iv.valor) over (partition by iv.indicador_codigo order by iv.data_referencia)) as r
    from public.indicadores_valores iv
    join public.indicadores i on i.codigo = iv.indicador_codigo
    where i.tipo = 'cambio' and i.ativo and iv.data_referencia between p_inicio and p_fim
  ),
  estat as (
    select p.indicador_codigo, max(p.data_referencia) as ultima_data,
      (array_agg(p.valor order by p.data_referencia))[1] as primeiro,
      (array_agg(p.valor order by p.data_referencia desc))[1] as ultimo,
      avg(p.valor) as media, min(p.valor) as minimo, max(p.valor) as maximo,
      stddev_samp(p.r) * sqrt(252::numeric) as vol
    from periodo p
    group by p.indicador_codigo
  )
  select e.indicador_codigo, e.ultima_data, e.ultimo,
    round((e.ultimo / e.primeiro - 1) * 100, 6),
    round(e.media, 6), e.minimo, e.maximo,
    round(e.vol * 100, 6),
    round((e.ultimo / public.valor_em(e.indicador_codigo, (date_trunc('month', e.ultima_data) - interval '1 day')::date) - 1) * 100, 6),
    round((e.ultimo / public.valor_em(e.indicador_codigo, (date_trunc('year', e.ultima_data) - interval '1 day')::date) - 1) * 100, 6),
    round((e.ultimo / public.valor_em(e.indicador_codigo, (e.ultima_data - interval '1 year')::date) - 1) * 100, 6),
    m.minimo_12m, m.maximo_12m
  from estat e
  cross join lateral (
    select min(iv.valor) as minimo_12m, max(iv.valor) as maximo_12m
    from public.indicadores_valores iv
    where iv.indicador_codigo = e.indicador_codigo
      and iv.data_referencia > (e.ultima_data - interval '1 year')::date
      and iv.data_referencia <= e.ultima_data
  ) m
  order by e.indicador_codigo
$$;

-- Série diária para gráficos, com média móvel de 21 dias úteis (C9).
create function public.serie_diaria(p_codigos text[], p_inicio date, p_fim date)
returns table (indicador_codigo text, data_referencia date, valor numeric, media_movel_21 numeric)
language sql
stable
set search_path = ''
as $$
  with base as (
    select iv.indicador_codigo, iv.data_referencia, iv.valor,
      avg(iv.valor) over w as media, count(*) over w as n
    from public.indicadores_valores iv
    join public.indicadores i on i.codigo = iv.indicador_codigo
    where iv.indicador_codigo = any (p_codigos) and i.ativo and i.periodicidade = 'diaria'
      and iv.data_referencia between p_inicio - 45 and p_fim
    window w as (partition by iv.indicador_codigo order by iv.data_referencia rows between 20 preceding and current row)
  )
  select b.indicador_codigo, b.data_referencia, b.valor,
    case when b.n = 21 then round(b.media, 6) end
  from base b
  where b.data_referencia >= p_inicio
  order by b.indicador_codigo, b.data_referencia
$$;
