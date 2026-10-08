-- Cadastro aberto por e-mail e senha (regras em Documentacao/regras-de-negocio.md §1).
-- Quem se cadastra por e-mail passa a nascer "usuario"; o Supabase Auth só emite sessão depois
-- da confirmação do e-mail ("Confirm email" ligado) e o Portal nega acesso a e-mail não confirmado.
-- O admin continua sendo definido apenas pelo script criar_admin.py.

create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Sem provedor informado não há como saber a origem: cai em sem_acesso (falha fechada).
  v_provedor text := coalesce(new.raw_app_meta_data ->> 'provider', 'desconhecido');
begin
  insert into public.perfis (user_id, email, nome, provedor, papel)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    left(nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')), ''), 120),
    v_provedor,
    (case when v_provedor in ('google', 'email') then 'usuario' else 'sem_acesso' end)::public.papel_usuario
  );
  return new;
end;
$$;

-- Cadastros por e-mail anteriores e já confirmados (nascidos sem acesso) passam a ser usuários.
update public.perfis p set papel = 'usuario'
from auth.users u
where u.id = p.user_id and p.provedor = 'email' and p.papel = 'sem_acesso' and u.email_confirmed_at is not null;

-- Admin bloqueia/desbloqueia usuários de Google e de e-mail; nunca altera outro admin.
drop policy perfis_admin_bloqueia_usuario_google on public.perfis;
create policy perfis_admin_bloqueia_usuario on public.perfis
  for update to authenticated
  using ((select public.eh_admin()) and provedor in ('google', 'email') and papel in ('usuario', 'bloqueado'))
  with check ((select public.eh_admin()) and provedor in ('google', 'email') and papel in ('usuario', 'bloqueado'));

-- Limite de uso por usuário (ex.: perguntas ao assistente), compartilhado entre as instâncias
-- serverless. Sem políticas: só a função consumir_limite (security definer) lê e grava.
create table public.limites_uso (
  user_id uuid not null references auth.users (id) on delete cascade,
  chave text not null check (chave ~ '^[a-z_]{1,40}$'),
  janela_inicio timestamptz not null,
  contagem integer not null check (contagem >= 0),
  primary key (user_id, chave)
);

comment on table public.limites_uso is 'Contagem de uso por usuário e janela de tempo. Acesso só via consumir_limite().';

alter table public.limites_uso enable row level security;
revoke all on public.limites_uso from anon, authenticated;

-- Cotas fixas por chave, definidas aqui (nunca por quem chama): o usuário não consegue
-- alterar o próprio limite chamando a função direto pela API REST.
create function public.cota_limite(p_chave text, out maximo integer, out janela interval)
language sql
immutable
set search_path = ''
as $$
  select c.maximo, c.janela
  from (values ('assistente', 20, interval '10 minutes')) as c (chave, maximo, janela)
  where c.chave = p_chave
$$;

revoke execute on function public.cota_limite(text) from public, anon, authenticated;

-- Consome uma unidade da cota do PRÓPRIO usuário (auth.uid()); retorna false se a cota da
-- janela atual acabou. Falha fechada: sem usuário autenticado, nega; chave desconhecida, erro.
create function public.consumir_limite(p_chave text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_agora timestamptz := now();
  v_maximo integer;
  v_janela interval;
  v_contagem integer;
begin
  if v_uid is null then
    return false;
  end if;
  select c.maximo, c.janela into v_maximo, v_janela from public.cota_limite(p_chave) c;
  if v_maximo is null then
    raise exception 'Limite desconhecido.' using errcode = '22023';
  end if;

  insert into public.limites_uso as l (user_id, chave, janela_inicio, contagem)
  values (v_uid, p_chave, v_agora, 1)
  on conflict (user_id, chave) do update
    set janela_inicio = case when l.janela_inicio <= v_agora - v_janela then v_agora else l.janela_inicio end,
        contagem = case when l.janela_inicio <= v_agora - v_janela then 1 else l.contagem + 1 end
  returning contagem into v_contagem;

  return v_contagem <= v_maximo;
end;
$$;

revoke execute on function public.consumir_limite(text) from public, anon;
grant execute on function public.consumir_limite(text) to authenticated;
