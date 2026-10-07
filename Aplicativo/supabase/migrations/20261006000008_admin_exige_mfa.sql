-- O MFA do admin passa a valer também no banco: permissões de admin exigem sessão aal2
-- (senha + TOTP). Sem isto, um token só com senha (aal1) agiria como admin via API REST.

create or replace function public.eh_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(public.papel_atual() = 'admin', false)
     and coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
$$;

-- tem_acesso: admin só conta com aal2; usuário Google segue com aal1.
create or replace function public.tem_acesso()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(public.papel_atual() = 'usuario', false) or public.eh_admin()
$$;
