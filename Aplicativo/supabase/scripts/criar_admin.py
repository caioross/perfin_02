"""Cria (ou promove) o usuário administrador do Portal Perfin.

Uso:  python Aplicativo/supabase/scripts/criar_admin.py
Lê ADMIN_EMAIL e ADMIN_PASSWORD (ambiente ou .env da raiz), além de NEXT_PUBLIC_SUPABASE_URL,
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY e DATABASE_URL. A senha nunca vai para a Vercel.

- Se o usuário não existe: cadastra pelo Supabase Auth (e-mail/senha), confirma o e-mail
  e define o papel admin.
- Se já existe (ex.: criado pelo Dashboard): apenas define o papel admin.
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
        if not existente:
            senha = obter("ADMIN_PASSWORD")
            if len(senha) < TAMANHO_MINIMO_SENHA:
                raise SystemExit(
                    f"ADMIN_PASSWORD precisa ter pelo menos {TAMANHO_MINIMO_SENHA} caracteres. "
                    "Troque a senha no .env e rode de novo."
                )
            cadastrar_no_auth(email, senha)
        if not promover(conexao, email, criado_agora=not existente):
            raise SystemExit("Usuário não promovido: precisa ser de e-mail/senha e com e-mail confirmado.")
    print("Administrador pronto. Ative o MFA (TOTP) no primeiro acesso.")


if __name__ == "__main__":
    main()
