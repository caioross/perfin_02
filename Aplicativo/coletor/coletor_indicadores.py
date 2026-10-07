"""Coletor de indicadores econômicos do Banco Central (API SGS) para o Supabase.

Uso:  python coletor_indicadores.py
Variável obrigatória: COLETOR_DATABASE_URL (conexão Postgres do role coletor_indicadores,
pelo pooler do Supabase). Roda diariamente pelo GitHub Actions.

Para cada indicador ativo do catálogo (tabela `indicadores`):
  1. busca na API SGS a partir da última data gravada (menos uma janela de revisão);
  2. grava com upsert em `indicadores_valores` (sem duplicar);
  3. registra o resultado em `coletas` (sucesso/falha, sem segredos).
Termina com código 1 se algum indicador falhar, para o workflow ficar vermelho.
"""

from __future__ import annotations

import os
import sys
import time
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation

import psycopg
import requests

URL_SGS = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{serie}/dados"
DATA_INICIAL_PADRAO = date(2015, 1, 1)
JANELA_REVISAO_DIAS = 45
ANOS_POR_CONSULTA = 5
TENTATIVAS = 3
TIMEOUT_SEGUNDOS = 60


@dataclass(frozen=True)
class Indicador:
    codigo: str
    serie_sgs: int


def listar_indicadores(conexao: psycopg.Connection) -> list[Indicador]:
    linhas = conexao.execute(
        "select codigo, serie_sgs from public.indicadores where ativo order by ordem"
    ).fetchall()
    return [Indicador(codigo, serie) for codigo, serie in linhas]


def data_inicial(conexao: psycopg.Connection, codigo: str) -> date:
    ultima = conexao.execute(
        "select max(data_referencia) from public.indicadores_valores where indicador_codigo = %s",
        (codigo,),
    ).fetchone()[0]
    if ultima is None:
        return DATA_INICIAL_PADRAO
    return ultima - timedelta(days=JANELA_REVISAO_DIAS)


def intervalos(inicio: date, fim: date) -> list[tuple[date, date]]:
    """Divide o período em blocos (a API SGS limita o intervalo de séries diárias)."""
    blocos = []
    atual = inicio
    while atual <= fim:
        limite = min(date(atual.year + ANOS_POR_CONSULTA, atual.month, 1) - timedelta(days=1), fim)
        blocos.append((atual, limite))
        atual = limite + timedelta(days=1)
    return blocos


def consultar_sgs(serie: int, inicio: date, fim: date) -> list[dict[str, str]]:
    parametros = {
        "formato": "json",
        "dataInicial": inicio.strftime("%d/%m/%Y"),
        "dataFinal": fim.strftime("%d/%m/%Y"),
    }
    for tentativa in range(1, TENTATIVAS + 1):
        try:
            resposta = requests.get(URL_SGS.format(serie=serie), params=parametros, timeout=TIMEOUT_SEGUNDOS)
            if resposta.status_code == 404:
                return []  # a API responde 404 quando não há dados no intervalo
            resposta.raise_for_status()
            return resposta.json()
        except (requests.RequestException, ValueError):
            if tentativa == TENTATIVAS:
                raise
            time.sleep(2 ** tentativa)
    return []


def converter(registros: list[dict[str, str]]) -> list[tuple[date, Decimal]]:
    convertidos = []
    for registro in registros:
        try:
            dia = datetime.strptime(registro["data"], "%d/%m/%Y").date()
            valor = Decimal(str(registro["valor"]).replace(",", "."))
        except (KeyError, ValueError, InvalidOperation):
            continue  # ignora linhas malformadas da API
        convertidos.append((dia, valor))
    return convertidos


def gravar(conexao: psycopg.Connection, codigo: str, valores: list[tuple[date, Decimal]]) -> int:
    """Upsert dos valores; retorna quantas linhas foram inseridas ou alteradas."""
    if not valores:
        return 0
    sql = """
        insert into public.indicadores_valores (indicador_codigo, data_referencia, valor)
        values (%s, %s, %s)
        on conflict (indicador_codigo, data_referencia) do update
          set valor = excluded.valor, coletado_em = now()
          where public.indicadores_valores.valor is distinct from excluded.valor
    """
    with conexao.cursor() as cursor:
        cursor.executemany(sql, [(codigo, dia, valor) for dia, valor in valores])
        return max(cursor.rowcount, 0)


def registrar_coleta(conexao, codigo: str, iniciada: datetime, status: str, registros: int, erro: str | None):
    conexao.execute(
        """insert into public.coletas (indicador_codigo, iniciada_em, status, registros, erro)
           values (%s, %s, %s, %s, %s)""",
        (codigo, iniciada, status, registros, erro[:500] if erro else None),
    )


def coletar_indicador(conexao: psycopg.Connection, indicador: Indicador, hoje: date) -> bool:
    iniciada = datetime.now(timezone.utc)
    try:
        with conexao.transaction():
            valores = []
            for inicio, fim in intervalos(data_inicial(conexao, indicador.codigo), hoje):
                valores.extend(converter(consultar_sgs(indicador.serie_sgs, inicio, fim)))
            registros = gravar(conexao, indicador.codigo, valores)
            registrar_coleta(conexao, indicador.codigo, iniciada, "sucesso", registros, None)
        print(f"[ok] {indicador.codigo}: {registros} registro(s) inserido(s)/alterado(s)")
        return True
    except Exception as erro:  # noqa: BLE001 — registra qualquer falha e segue para o próximo
        mensagem = f"{type(erro).__name__}: {erro}"
        print(f"[falha] {indicador.codigo}: {mensagem[:200]}")
        try:
            with conexao.transaction():
                registrar_coleta(conexao, indicador.codigo, iniciada, "falha", 0, mensagem)
        except psycopg.Error as erro_registro:
            # Ex.: conexão caiu. Não interrompe a coleta dos próximos indicadores.
            print(f"[aviso] não foi possível registrar a falha de {indicador.codigo}: {type(erro_registro).__name__}")
        return False


def main() -> int:
    url = os.environ.get("COLETOR_DATABASE_URL")
    if not url:
        print("Variável COLETOR_DATABASE_URL não definida.")
        return 1
    hoje = date.today()
    with psycopg.connect(url, autocommit=True) as conexao:
        indicadores = listar_indicadores(conexao)
    resultados = []
    for indicador in indicadores:
        # Uma conexão por indicador: se uma cair, os próximos seguem com conexão nova.
        with psycopg.connect(url, autocommit=True) as conexao:
            resultados.append(coletar_indicador(conexao, indicador, hoje))
    return 0 if all(resultados) else 1


if __name__ == "__main__":
    sys.exit(main())
