-- Situação dos dados, saúde da coleta (admin), termômetro público (site) e permissões de execução.

-- Regra de dado desatualizado: mensal sem atualização há mais de 45 dias após o fim do mês
-- de referência; diário com mais de 5 dias úteis sem nova cotação.
create function public.indicador_desatualizado(p_periodicidade text, p_ultima_data date, p_hoje date)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when p_ultima_data is null then true
    when p_periodicidade = 'mensal'
      then p_hoje - (p_ultima_data + interval '1 month' - interval '1 day')::date > 45
    else (
      select count(*) from generate_series(p_ultima_data + 1, p_hoje, interval '1 day') d
      where extract(isodow from d) < 6
    ) > 5
  end
$$;

create function public.situacao_indicadores()
returns table (
  indicador_codigo text,
  nome text,
  tipo text,
  periodicidade text,
  ultima_data date,
  desatualizado boolean
)
language sql
stable
set search_path = ''
as $$
  select i.codigo, i.nome, i.tipo, i.periodicidade, u.ultima,
    public.indicador_desatualizado(i.periodicidade, u.ultima, current_date)
  from public.indicadores i
  cross join lateral (
    select max(iv.data_referencia) as ultima
    from public.indicadores_valores iv where iv.indicador_codigo = i.codigo
  ) u
  where i.ativo
  order by i.ordem
$$;

-- Saúde da coleta por indicador (somente admin; as políticas de coletas também exigem admin).
create function public.saude_coleta()
returns table (
  indicador_codigo text,
  nome text,
  ativo boolean,
  ultima_data date,
  desatualizado boolean,
  ultima_coleta timestamptz,
  ultimo_status text,
  ultimos_registros integer,
  ultimo_erro text
)
language plpgsql
stable
set search_path = ''
as $$
begin
  if not public.eh_admin() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  return query
    select i.codigo, i.nome, i.ativo, u.ultima,
      public.indicador_desatualizado(i.periodicidade, u.ultima, current_date),
      c.finalizada_em, c.status, c.registros, c.erro
    from public.indicadores i
    cross join lateral (
      select max(iv.data_referencia) as ultima
      from public.indicadores_valores iv where iv.indicador_codigo = i.codigo
    ) u
    left join lateral (
      select co.finalizada_em, co.status, co.registros, co.erro
      from public.coletas co where co.indicador_codigo = i.codigo
      order by co.finalizada_em desc limit 1
    ) c on true
    order by i.ordem;
end;
$$;

-- Termômetro público do site: apenas os últimos valores agregados, sem histórico.
-- security definer porque anon não lê as tabelas (RLS fechado); expõe só dados públicos do BCB.
create function public.termometro_publico()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with juros as (
    select * from public.resumo_juros(current_date, current_date)
  ),
  meta as (
    select * from public.status_meta_inflacao(current_date)
  ),
  itens as (
    select i.codigo, i.nome, i.ordem,
      case i.codigo
        when 'ipca'  then 'Acumulado em 12 meses'
        when 'igpm'  then 'Acumulado em 12 meses'
        when 'inpc'  then 'Acumulado em 12 meses'
        when 'selic' then 'Meta (% ao ano)'
        when 'cdi'   then 'Acumulado em 12 meses'
        else 'Última cotação (R$)'
      end as rotulo,
      case
        when i.tipo = 'inflacao' then (select r.acumulado_12m from public.resumo_inflacao(current_date, current_date) r
                                       where r.indicador_codigo = i.codigo)
        when i.codigo = 'selic' then (select j.selic_atual from juros j)
        when i.codigo = 'cdi' then (select j.cdi_12m from juros j)
        else public.valor_em(i.codigo, current_date)
      end as valor,
      case
        when i.tipo = 'inflacao' then public.ultimo_mes_publicado(i.codigo, current_date)
        when i.codigo = 'cdi' then (select j.referencia_12m from juros j)
        else (select max(iv.data_referencia) from public.indicadores_valores iv where iv.indicador_codigo = i.codigo)
      end as data_referencia
    from public.indicadores i
    where i.ativo
  )
  select jsonb_build_object(
    'atualizado_em', (select max(iv.coletado_em) from public.indicadores_valores iv),
    'indicadores', coalesce((
      select jsonb_agg(jsonb_build_object(
        'codigo', it.codigo, 'nome', it.nome, 'rotulo', it.rotulo,
        'valor', it.valor, 'data_referencia', it.data_referencia) order by it.ordem)
      from itens it
    ), '[]'::jsonb),
    'meta', (select to_jsonb(m) from meta m)
  )
$$;

-- Permissões de execução: nada para anon além do termômetro; authenticated chama as
-- funções de cálculo (que respeitam RLS por serem security invoker).
revoke execute on all functions in schema public from public, anon;

grant execute on function
  public.meses_entre(date, date),
  public.acumulado_mensal(text, date, date),
  public.ultimo_mes_publicado(text, date),
  public.serie_inflacao(date, date),
  public.resumo_inflacao(date, date),
  public.status_meta_inflacao(date),
  public.acumulado_diario(text, date, date, numeric),
  public.valor_em(text, date),
  public.resumo_juros(date, date),
  public.decisoes_selic(date, date),
  public.ciclo_selic(date),
  public.serie_juros_mensal(date, date),
  public.resumo_cambio(date, date),
  public.serie_diaria(text[], date, date),
  public.validar_valor_monetario(numeric),
  public.validar_periodo(date, date),
  public.validar_indice_inflacao(text),
  public.corrigir_valor(text, numeric, date, date),
  public.reajuste_contrato(numeric, date),
  public.poder_de_compra(numeric, date, date),
  public.rendimento_real_cdi(numeric, numeric, date, date),
  public.indicador_desatualizado(text, date, date),
  public.situacao_indicadores(),
  public.saude_coleta()
to authenticated;

grant execute on function public.termometro_publico() to anon, authenticated;

-- Funções criadas no futuro não ficam executáveis por anon por padrão.
alter default privileges in schema public revoke execute on functions from public, anon;
