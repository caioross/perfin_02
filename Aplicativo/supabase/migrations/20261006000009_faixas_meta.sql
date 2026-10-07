-- Faixa da meta de inflação por ano (piso e teto) calculada no banco, para o gráfico de
-- inflação não refazer conta na aplicação (regra C6).
create function public.faixas_meta_inflacao()
returns table (ano smallint, centro numeric, piso numeric, teto numeric)
language sql
stable
set search_path = ''
as $$
  select m.ano, m.centro, m.centro - m.tolerancia, m.centro + m.tolerancia
  from public.metas_inflacao m
  order by m.ano
$$;

revoke execute on function public.faixas_meta_inflacao() from public, anon;
grant execute on function public.faixas_meta_inflacao() to authenticated;
