-- Perfis de acesso do Portal Perfin (regras em Documentacao/regras-de-negocio.md §1).
-- Regra fechada por padrão: todo usuário novo nasce sem acesso, exceto login Google.

create type public.papel_usuario as enum ('admin', 'usuario', 'sem_acesso', 'bloqueado');

create table public.perfis (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nome text,
  provedor text not null,
  papel public.papel_usuario not null default 'sem_acesso',
  ultimo_acesso timestamptz,
  criado_em timestamptz not null default now()
);

comment on table public.perfis is 'Perfil e papel de cada usuário. Papel padrão sem_acesso (falha fechada).';

alter table public.perfis enable row level security;
revoke all on public.perfis from anon, authenticated;
grant select on public.perfis to authenticated;
grant update (papel) on public.perfis to authenticated;

-- Papel do usuário autenticado. security definer para ler perfis sem recursão de RLS.
create function public.papel_atual()
returns public.papel_usuario
language sql
stable
security definer
set search_path = ''
as $$
  select p.papel from public.perfis p where p.user_id = (select auth.uid())
$$;

create function public.eh_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(public.papel_atual() = 'admin', false)
$$;

create function public.tem_acesso()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(public.papel_atual() in ('admin', 'usuario'), false)
$$;

-- Atualiza o último acesso do próprio usuário (chamado após o login).
create function public.registrar_acesso()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.perfis set ultimo_acesso = now() where user_id = (select auth.uid())
$$;

revoke execute on function public.papel_atual(), public.eh_admin(), public.tem_acesso(), public.registrar_acesso()
  from public, anon;
grant execute on function public.papel_atual(), public.eh_admin(), public.tem_acesso(), public.registrar_acesso()
  to authenticated;

create policy perfis_ler_proprio_ou_admin on public.perfis
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.eh_admin()));

-- Admin só bloqueia/desbloqueia usuários Google; nunca altera outro admin nem libera cadastro por e-mail.
create policy perfis_admin_bloqueia_usuario_google on public.perfis
  for update to authenticated
  using ((select public.eh_admin()) and provedor = 'google' and papel in ('usuario', 'bloqueado'))
  with check ((select public.eh_admin()) and provedor = 'google' and papel in ('usuario', 'bloqueado'));

-- Cria o perfil de todo usuário novo do Supabase Auth.
create function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_provedor text := coalesce(new.raw_app_meta_data ->> 'provider', 'email');
begin
  insert into public.perfis (user_id, email, nome, provedor, papel)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    v_provedor,
    (case when v_provedor = 'google' then 'usuario' else 'sem_acesso' end)::public.papel_usuario
  );
  return new;
end;
$$;

revoke execute on function public.criar_perfil_novo_usuario() from public, anon, authenticated;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();
