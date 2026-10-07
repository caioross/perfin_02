-- Tokens Google (cifrados) e relatórios mensais gerados no Drive.

-- Sem políticas para clientes: só o servidor do Portal acessa, com a secret key (service_role).
-- O refresh token é gravado cifrado (AES-256-GCM) com TOKEN_ENCRYPTION_KEY.
create table public.google_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token_cifrado text not null,
  escopos text[] not null default '{}',
  atualizado_em timestamptz not null default now()
);

alter table public.google_tokens enable row level security;
revoke all on public.google_tokens from anon, authenticated;

create table public.relatorios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mes_referencia date not null check (extract(day from mes_referencia) = 1),
  drive_file_id text not null check (char_length(drive_file_id) between 1 and 200),
  drive_url text not null check (drive_url like 'https://docs.google.com/%'),
  rascunho_gmail_id text check (char_length(rascunho_gmail_id) <= 200),
  criado_em timestamptz not null default now()
);

create index relatorios_usuario_criado_idx on public.relatorios (user_id, criado_em desc);

alter table public.relatorios enable row level security;
revoke all on public.relatorios from anon, authenticated;
grant select, insert on public.relatorios to authenticated;
grant update (rascunho_gmail_id) on public.relatorios to authenticated;

create policy relatorios_dono_ler on public.relatorios
  for select to authenticated
  using (user_id = (select auth.uid()) and (select public.papel_atual()) = 'usuario');
create policy relatorios_dono_insere on public.relatorios
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.papel_atual()) = 'usuario');
create policy relatorios_dono_registra_rascunho on public.relatorios
  for update to authenticated
  using (user_id = (select auth.uid()) and (select public.papel_atual()) = 'usuario')
  with check (user_id = (select auth.uid()) and (select public.papel_atual()) = 'usuario');
