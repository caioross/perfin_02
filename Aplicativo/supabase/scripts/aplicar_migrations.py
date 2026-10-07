"""Aplica as migrations SQL de `Aplicativo/supabase/migrations` em ordem.

Uso:  python Aplicativo/supabase/scripts/aplicar_migrations.py
Requer DATABASE_URL (ambiente ou .env da raiz). Cada arquivo roda em uma
transação própria e é registrado em `controle.migrations`; arquivos já
aplicados são ignorados.
"""

from __future__ import annotations

from pathlib import Path

import psycopg

from _env import url_banco

PASTA_MIGRATIONS = Path(__file__).resolve().parents[1] / "migrations"

SQL_CONTROLE = """
create schema if not exists controle;
revoke all on schema controle from public;
create table if not exists controle.migrations (
  nome text primary key,
  aplicada_em timestamptz not null default now()
);
"""


def migrations_pendentes(conexao: psycopg.Connection) -> list[Path]:
    aplicadas = {linha[0] for linha in conexao.execute("select nome from controle.migrations")}
    arquivos = sorted(PASTA_MIGRATIONS.glob("*.sql"))
    return [arquivo for arquivo in arquivos if arquivo.name not in aplicadas]


def main() -> None:
    with psycopg.connect(url_banco(), autocommit=False) as conexao:
        conexao.execute(SQL_CONTROLE)
        conexao.commit()
        pendentes = migrations_pendentes(conexao)
        if not pendentes:
            print("Nenhuma migration pendente.")
            return
        for arquivo in pendentes:
            with conexao.transaction():
                conexao.execute(arquivo.read_text(encoding="utf-8"))
                conexao.execute("insert into controle.migrations (nome) values (%s)", (arquivo.name,))
            print(f"Aplicada: {arquivo.name}")


if __name__ == "__main__":
    main()
