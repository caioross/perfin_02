-- Catálogo de indicadores, valores coletados do BCB/SGS, metas de inflação e log de coletas.

create table public.indicadores (
  codigo text primary key check (codigo ~ '^[a-z_]{2,20}$'),
  nome text not null,
  unidade text not null,
  tipo text not null check (tipo in ('inflacao', 'juros', 'cambio')),
  periodicidade text not null check (periodicidade in ('mensal', 'diaria')),
  serie_sgs integer not null unique check (serie_sgs > 0),
  casas_decimais smallint not null default 2 check (casas_decimais between 0 and 6),
  ordem smallint not null default 0,
  ativo boolean not null default true
);

insert into public.indicadores (codigo, nome, unidade, tipo, periodicidade, serie_sgs, casas_decimais, ordem) values
  ('ipca',  'IPCA',               '% ao mês', 'inflacao', 'mensal', 433,   2, 1),
  ('igpm',  'IGP-M',              '% ao mês', 'inflacao', 'mensal', 189,   2, 2),
  ('inpc',  'INPC',               '% ao mês', 'inflacao', 'mensal', 188,   2, 3),
  ('selic', 'Selic meta',         '% ao ano', 'juros',    'diaria', 432,   2, 4),
  ('cdi',   'CDI',                '% ao dia', 'juros',    'diaria', 12,    6, 5),
  ('dolar', 'Dólar (PTAX venda)', 'R$',       'cambio',   'diaria', 1,     4, 6),
  ('euro',  'Euro (PTAX venda)',  'R$',       'cambio',   'diaria', 21619, 4, 7);

-- Séries mensais usam o 1º dia do mês em data_referencia.
create table public.indicadores_valores (
  id bigint generated always as identity primary key,
  indicador_codigo text not null references public.indicadores (codigo),
  data_referencia date not null,
  valor numeric(18, 6) not null,
  coletado_em timestamptz not null default now(),
  unique (indicador_codigo, data_referencia)
);

create table public.metas_inflacao (
  ano smallint primary key check (ano between 1999 and 2100),
  centro numeric(5, 2) not null check (centro > 0),
  tolerancia numeric(5, 2) not null check (tolerancia >= 0),
  atualizado_por uuid default auth.uid() references auth.users (id) on delete set null,
  atualizado_em timestamptz not null default now()
);

-- Metas definidas pelo CMN (centro e tolerância em p.p.). O admin mantém os anos seguintes.
insert into public.metas_inflacao (ano, centro, tolerancia) values
  (2018, 4.50, 1.50), (2019, 4.25, 1.50), (2020, 4.00, 1.50), (2021, 3.75, 1.50),
  (2022, 3.50, 1.50), (2023, 3.25, 1.50), (2024, 3.00, 1.50), (2025, 3.00, 1.50),
  (2026, 3.00, 1.50);

create table public.coletas (
  id bigint generated always as identity primary key,
  indicador_codigo text not null references public.indicadores (codigo),
  iniciada_em timestamptz not null,
  finalizada_em timestamptz not null default now(),
  status text not null check (status in ('sucesso', 'falha')),
  registros integer not null default 0 check (registros >= 0),
  erro text check (char_length(erro) <= 500)
);

create index coletas_indicador_finalizada_idx on public.coletas (indicador_codigo, finalizada_em desc);

alter table public.indicadores enable row level security;
alter table public.indicadores_valores enable row level security;
alter table public.metas_inflacao enable row level security;
alter table public.coletas enable row level security;

revoke all on public.indicadores, public.indicadores_valores, public.metas_inflacao, public.coletas
  from anon, authenticated;

grant select on public.indicadores, public.indicadores_valores, public.metas_inflacao, public.coletas
  to authenticated;
grant update (ativo) on public.indicadores to authenticated;
grant insert, update on public.metas_inflacao to authenticated;

create policy indicadores_ler on public.indicadores
  for select to authenticated using ((select public.tem_acesso()));
create policy indicadores_admin_ativa on public.indicadores
  for update to authenticated
  using ((select public.eh_admin())) with check ((select public.eh_admin()));

create policy valores_ler on public.indicadores_valores
  for select to authenticated using ((select public.tem_acesso()));

create policy metas_ler on public.metas_inflacao
  for select to authenticated using ((select public.tem_acesso()));
create policy metas_admin_insere on public.metas_inflacao
  for insert to authenticated with check ((select public.eh_admin()));
create policy metas_admin_altera on public.metas_inflacao
  for update to authenticated
  using ((select public.eh_admin())) with check ((select public.eh_admin()));

create policy coletas_admin_ler on public.coletas
  for select to authenticated using ((select public.eh_admin()));

-- Role do coletor Python (GitHub Actions): mínimo privilégio. A senha/login é definida
-- fora das migrations pelo script definir_senha_coletor.py (nunca versionada).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'coletor_indicadores') then
    create role coletor_indicadores nologin;
  end if;
end;
$$;

grant usage on schema public to coletor_indicadores;
grant select on public.indicadores to coletor_indicadores;
grant select, insert on public.indicadores_valores to coletor_indicadores;
grant update (valor, coletado_em) on public.indicadores_valores to coletor_indicadores;
grant insert on public.coletas to coletor_indicadores;

create policy coletor_le_indicadores on public.indicadores
  for select to coletor_indicadores using (true);
create policy coletor_le_valores on public.indicadores_valores
  for select to coletor_indicadores using (true);
create policy coletor_insere_valores on public.indicadores_valores
  for insert to coletor_indicadores with check (true);
create policy coletor_atualiza_valores on public.indicadores_valores
  for update to coletor_indicadores using (true) with check (true);
create policy coletor_registra_coleta on public.coletas
  for insert to coletor_indicadores with check (true);
