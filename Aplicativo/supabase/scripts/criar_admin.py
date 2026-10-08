"""Cria (ou promove) o usuário administrador do Portal Perfin.

Uso:  python Aplicativo/supabase/scripts/criar_admin.py
Lê ADMIN_EMAIL e ADMIN_PASSWORD (ambiente ou .env da raiz), além de NEXT_PUBLIC_SUPABASE_URL,
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY e DATABASE_URL. A senha nunca vai para a Vercel.

- Se o usuário não existe: cadastra pelo Supabase Auth (e-mail/senha), confirma o e-mail
  e define o papel admin.
- Se já existe (ex.: criado pelo Dashboard): só define o papel admin se o e-mail estiver confirmado
  e a senha conferir com ADMIN_PASSWORD (o cadastro do Portal é aberto).
Recusa senhas com menos de 12 caracteres (falha fechada).
"""

from __future__ import annotations

import psycopg
import requests

from _env import obter, url_banco

TAMANHO_MINIMO_SENHA = 12


def cadastrar_no_auth(email: str, senha: str) -> None:
    resposta = requests.post(
        f"{obter('NEXT_PUBLIC_SUPABASE_URL').rstrip('/')}/auth/v1/signup",
        headers={"apikey": obter("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), "Content-Type": "application/json"},
        json={"email": email, "password": senha},
        timeout=30,
    )
    if resposta.status_code >= 400:
        raise SystemExit(
            f"O Supabase recusou o cadastro (HTTP {resposta.status_code}). Crie o usuário em "
            "Authentication > Users > Add user e rode este script de novo para promovê-lo."
        )


def senha_confere(email: str, senha: str) -> bool:
    """Confere a senha da conta pelo próprio Supabase Auth (login sem guardar a sessão)."""
    resposta = requests.post(
        f"{obter('NEXT_PUBLIC_SUPABASE_URL').rstrip('/')}/auth/v1/token",
        params={"grant_type": "password"},
        headers={"apikey": obter("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), "Content-Type": "application/json"},
        json={"email": email, "password": senha},
        timeout=30,
    )
    return resposta.status_code == 200


def promover(conexao: psycopg.Connection, email: str, criado_agora: bool) -> bool:
    with conexao.transaction():
        if criado_agora:
            # Só confirmamos o e-mail da conta que este script acabou de criar com a senha do .env.
            conexao.execute(
                "update auth.users set email_confirmed_at = now() where lower(email) = %s and email_confirmed_at is null",
                (email,),
            )
        cursor = conexao.execute(
            """update public.perfis p set papel = 'admin'
               from auth.users u
               where u.id = p.user_id and p.email = %s and p.provedor = 'email' and u.email_confirmed_at is not null""",
            (email,),
        )
        return cursor.rowcount == 1


def main() -> None:
    email = obter("ADMIN_EMAIL").strip().lower()
    with psycopg.connect(url_banco()) as conexao:
        existente = conexao.execute(
            "select email_confirmed_at is not null from auth.users where lower(email) = %s", (email,)
        ).fetchone()
        if existente and not existente[0]:
            # Conta pré-existente e não confirmada pode ter sido criada por terceiros: nunca promover.
            raise SystemExit(
                "Já existe um usuário com ADMIN_EMAIL sem e-mail confirmado. Apague-o em Authentication > Users "
                "e rode o script de novo (ou crie o admin pelo Dashboard com e-mail confirmado)."
            )
        senha = obter("ADMIN_PASSWORD")
        if len(senha) < TAMANHO_MINIMO_SENHA:
            raise SystemExit(
                f"ADMIN_PASSWORD precisa ter pelo menos {TAMANHO_MINIMO_SENHA} caracteres. "
                "Troque a senha no .env e rode de novo."
            )
        if existente and not senha_confere(email, senha):
            # Com o cadastro aberto, alguém pode ter registrado o ADMIN_EMAIL antes: só promove
            # a conta cuja senha é a do .env (prova de que ela é do administrador).
            raise SystemExit(
                "Já existe um usuário com ADMIN_EMAIL e a senha não confere com ADMIN_PASSWORD. Confira a conta em "
                "Authentication > Users (apague-a se não for sua) e rode o script de novo."
            )
        if not existente:
            cadastrar_no_auth(email, senha)
        if not promover(conexao, email, criado_agora=not existente):
            raise SystemExit("Usuário não promovido: precisa ser de e-mail/senha e com e-mail confirmado.")
    print("Administrador pronto. Ative o MFA (TOTP) no primeiro acesso.")


if __name__ == "__main__":
    main()
