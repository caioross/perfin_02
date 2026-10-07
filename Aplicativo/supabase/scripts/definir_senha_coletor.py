"""Gera uma senha nova para o role `coletor_indicadores` e mostra a COLETOR_DATABASE_URL.

Uso (no seu terminal, não em logs compartilhados):
    python Aplicativo/supabase/scripts/definir_senha_coletor.py

Requer DATABASE_URL e SUPABASE_POOLER_HOST (ambiente ou .env da raiz).
Copie a URL exibida para o Secret `COLETOR_DATABASE_URL` do GitHub Actions.
Rodar de novo troca a senha (a URL anterior deixa de funcionar).
"""

from __future__ import annotations

import secrets
from urllib.parse import urlsplit

import psycopg
from psycopg import sql

from _env import obter, url_banco


def gerar_senha_coletor() -> str:
    senha = secrets.token_urlsafe(32)
    with psycopg.connect(url_banco(), autocommit=True) as conexao:
        conexao.execute(
            sql.SQL("alter role coletor_indicadores with login password {}").format(sql.Literal(senha))
        )
    return senha


def montar_url(senha: str) -> str:
    host_direto = urlsplit(obter("DATABASE_URL")).hostname or ""
    ref = host_direto.split(".")[1]
    pooler = obter("SUPABASE_POOLER_HOST")
    return f"postgresql://coletor_indicadores.{ref}:{senha}@{pooler}:5432/postgres?sslmode=require"


def main() -> None:
    url = montar_url(gerar_senha_coletor())
    print("Senha do role coletor_indicadores atualizada.")
    print("Cadastre no GitHub (Settings > Secrets and variables > Actions) o Secret:")
    print(f"COLETOR_DATABASE_URL={url}")


if __name__ == "__main__":
    main()
