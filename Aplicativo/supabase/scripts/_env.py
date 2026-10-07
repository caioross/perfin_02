"""Leitura de variáveis de ambiente para os scripts administrativos.

Procura primeiro no ambiente do processo e, se não encontrar, no arquivo
`.env` da raiz do repositório. Nunca imprime valores.
"""

from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit

RAIZ_REPOSITORIO = Path(__file__).resolve().parents[3]


def _ler_arquivo_env() -> dict[str, str]:
    caminho = RAIZ_REPOSITORIO / ".env"
    valores: dict[str, str] = {}
    if not caminho.exists():
        return valores
    for linha in caminho.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        chave, valor = linha.split("=", 1)
        valores[chave.strip()] = valor.strip().strip('"').strip("'")
    return valores


def obter(nome: str) -> str:
    """Retorna a variável `nome` ou encerra com erro se ela não existir."""
    valor = os.environ.get(nome) or _ler_arquivo_env().get(nome)
    if not valor:
        raise SystemExit(f"Variável de ambiente obrigatória ausente: {nome}")
    return valor


def url_banco() -> str:
    """URL do Postgres, trocando a conexão direta (só IPv6) pelo pooler IPv4.

    A conexão direta `db.<ref>.supabase.co` não resolve em redes sem IPv6.
    Se `SUPABASE_POOLER_HOST` estiver definido (ex.: aws-0-sa-east-1.pooler.supabase.com),
    a URL é reescrita para o pooler em modo sessão (porta 5432, usuário postgres.<ref>).
    """
    url = urlsplit(obter("DATABASE_URL"))
    pooler = os.environ.get("SUPABASE_POOLER_HOST") or _ler_arquivo_env().get("SUPABASE_POOLER_HOST")
    host = url.hostname or ""
    if not pooler or not (host.startswith("db.") and host.endswith(".supabase.co")):
        return url.geturl()
    ref = host.split(".")[1]
    usuario = f"{url.username}.{ref}"
    senha = quote(unquote(url.password or ""), safe="")
    return f"postgresql://{usuario}:{senha}@{pooler}:5432{url.path or '/postgres'}?sslmode=require"
