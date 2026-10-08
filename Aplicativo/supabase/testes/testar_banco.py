"""Testes do banco: cálculos contra valores oficiais publicados e regras de RLS por papel.

Uso:  python Aplicativo/supabase/testes/testar_banco.py
Requer DATABASE_URL (e SUPABASE_POOLER_HOST em redes sem IPv6). Cada teste roda numa
transação desfeita ao final: nada é gravado. Os testes de cálculo exigem a carga do coletor.
"""

from __future__ import annotations

import json
import sys
import unittest
import uuid
from contextlib import contextmanager
from decimal import Decimal
from pathlib import Path

import psycopg

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from _env import url_banco  # noqa: E402


class BaseBanco(unittest.TestCase):
    conexao: psycopg.Connection

    @classmethod
    def setUpClass(cls) -> None:
        cls.conexao = psycopg.connect(url_banco(), autocommit=False)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.conexao.close()

    def tearDown(self) -> None:
        self.conexao.rollback()

    def valor(self, consulta: str, parametros: tuple = ()):
        return self.conexao.execute(consulta, parametros).fetchone()[0]

    def criar_usuario(self, provedor: str, papel: str | None = None) -> str:
        uid = str(uuid.uuid4())
        self.conexao.execute(
            """insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
               values ('00000000-0000-0000-0000-000000000000', %s, 'authenticated', 'authenticated', %s, %s, '{}')""",
            (uid, f"teste-{uid[:8]}@exemplo.com", json.dumps({"provider": provedor})),
        )
        if papel:
            self.conexao.execute("update public.perfis set papel = %s where user_id = %s", (papel, uid))
        return uid

    @contextmanager
    def como(self, papel_pg: str, uid: str | None = None, aal: str = "aal1"):
        claims = json.dumps({"sub": uid, "role": papel_pg, "aal": aal}) if uid else json.dumps({"role": papel_pg})
        self.conexao.execute("select set_config('request.jwt.claims', %s, true)", (claims,))
        self.conexao.execute(f"set local role {papel_pg}")
        try:
            yield
        finally:
            self.conexao.execute("reset role")

    def assert_negado(self, consulta: str, parametros: tuple = ()):
        with self.assertRaises(psycopg.errors.InsufficientPrivilege):
            with self.conexao.transaction():
                self.conexao.execute(consulta, parametros)


class TestCalculos(BaseBanco):
    """Valores oficiais: IBGE (IPCA/INPC), FGV (IGP-M), B3/BCB (CDI, Selic, PTAX)."""

    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()
        # No CI o banco local não tem a carga do BCB: só os testes de acesso rodam.
        if not cls.conexao.execute("select exists (select 1 from public.indicadores_valores)").fetchone()[0]:
            cls.conexao.close()
            raise unittest.SkipTest("sem carga de indicadores (rode o coletor para testar os cálculos)")

    def assert_proximo(self, obtido, esperado: str, tolerancia: str = "0.005"):
        self.assertIsNotNone(obtido)
        self.assertLessEqual(abs(Decimal(obtido) - Decimal(esperado)), Decimal(tolerancia), f"{obtido} != {esperado}")

    def test_ipca_2024_e_2023(self):
        self.assert_proximo(self.valor("select acumulado_mensal('ipca','2024-01-01','2024-12-01')"), "4.83")
        self.assert_proximo(self.valor("select acumulado_mensal('ipca','2023-01-01','2023-12-01')"), "4.62")

    def test_igpm_e_inpc_2024(self):
        self.assert_proximo(self.valor("select acumulado_mensal('igpm','2024-01-01','2024-12-01')"), "6.54")
        self.assert_proximo(self.valor("select acumulado_mensal('inpc','2024-01-01','2024-12-01')"), "4.77")

    def test_cdi_2024(self):
        self.assert_proximo(self.valor("select acumulado_diario('cdi','2024-01-01','2024-12-31')"), "10.88", "0.02")

    def test_selic_e_ptax_fim_2024(self):
        self.assert_proximo(self.valor("select valor_em('selic','2024-12-31')"), "12.25")
        self.assert_proximo(self.valor("select valor_em('dolar','2024-12-31')"), "6.1923", "0.0001")

    def test_mes_nao_publicado_retorna_nulo(self):
        self.assertIsNone(self.valor("select acumulado_mensal('ipca', current_date - 60, current_date + 400)"))

    def test_serie_inflacao_bate_com_acumulado(self):
        linha = self.conexao.execute(
            "select acumulado_ano, acumulado_12m from serie_inflacao('2024-12-01','2024-12-01') where indicador_codigo='ipca'"
        ).fetchone()
        self.assert_proximo(linha[0], "4.83")
        self.assert_proximo(linha[1], "4.83")

    def test_decisoes_selic_2024(self):
        self.assertEqual(self.valor("select count(*) from decisoes_selic('2024-01-01','2024-12-31')"), 6)

    def test_corrigir_valor_e_reajuste(self):
        self.assert_proximo(self.valor("select valor_corrigido from corrigir_valor('ipca',100,'2024-01-01','2024-12-01')"), "104.83")
        self.assert_proximo(
            self.valor("select percentual from reajuste_contrato(1000,'2025-01-01') where indicador_codigo='igpm'"), "6.54"
        )

    def test_juro_real_fisher(self):
        cdi, ipca, real = self.conexao.execute(
            "select cdi_12m, ipca_12m, juro_real_12m from resumo_juros('2024-12-31','2024-12-31')"
        ).fetchone()
        esperado = ((1 + cdi / 100) / (1 + ipca / 100) - 1) * 100
        self.assert_proximo(real, str(round(esperado, 6)), "0.000002")

    def test_validacao_das_calculadoras(self):
        for consulta in (
            "select * from corrigir_valor('ipca', -1, '2024-01-01', '2024-12-01')",
            "select * from corrigir_valor('dolar', 100, '2024-01-01', '2024-12-01')",
            "select * from rendimento_real_cdi(100, 500, '2024-01-01', '2024-12-31')",
            "select * from poder_de_compra(100, '2024-12-01', '2024-01-01')",
        ):
            with self.assertRaises(psycopg.errors.InvalidParameterValue):
                with self.conexao.transaction():
                    self.conexao.execute(consulta)

    def test_termometro_publico(self):
        dados = self.valor("select termometro_publico()")
        codigos = {item["codigo"] for item in dados["indicadores"]}
        self.assertTrue({"ipca", "selic", "dolar"} <= codigos)
        self.assertIn(dados["meta"]["status"], {"abaixo_do_piso", "dentro_da_meta", "acima_do_teto"})


class TestAcesso(BaseBanco):
    def test_anon_so_acessa_termometro(self):
        with self.como("anon"):
            self.assert_negado("select * from indicadores_valores limit 1")
            self.assert_negado("select * from perfis limit 1")
            self.assert_negado("select acumulado_mensal('ipca','2024-01-01','2024-12-01')")
            self.assertIsNotNone(self.valor("select termometro_publico()"))

    def garantir_valor_indicador(self) -> None:
        # Linha de teste (desfeita no rollback) para os testes de leitura não dependerem da carga do BCB.
        self.conexao.execute(
            """insert into indicadores_valores (indicador_codigo, data_referencia, valor)
               values ('ipca', '2000-01-01', 0.1) on conflict do nothing"""
        )

    def test_cadastro_por_email_nasce_usuario(self):
        self.garantir_valor_indicador()
        uid = self.criar_usuario("email")
        self.assertEqual(self.valor("select papel::text from perfis where user_id=%s", (uid,)), "usuario")
        with self.como("authenticated", uid):
            self.assertGreater(self.valor("select count(*) from indicadores_valores"), 0)
            self.assert_negado("select * from google_tokens")

    def test_sem_provedor_nasce_sem_acesso(self):
        uid = str(uuid.uuid4())
        self.conexao.execute(
            """insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
               values ('00000000-0000-0000-0000-000000000000', %s, 'authenticated', 'authenticated', %s, '{}', '{}')""",
            (uid, f"sem-provedor-{uid[:8]}@exemplo.com"),
        )
        self.assertEqual(self.valor("select papel::text from perfis where user_id=%s", (uid,)), "sem_acesso")

    def test_outro_provedor_nasce_sem_acesso(self):
        self.garantir_valor_indicador()
        uid = self.criar_usuario("github")
        self.assertEqual(self.valor("select papel::text from perfis where user_id=%s", (uid,)), "sem_acesso")
        with self.como("authenticated", uid):
            self.assertEqual(self.valor("select count(*) from indicadores_valores"), 0)

    def garantir_valor_indicador(self) -> None:
        # Linha de teste (desfeita no rollback) para os testes de leitura não dependerem da carga do BCB.
        self.conexao.execute(
            """insert into indicadores_valores (indicador_codigo, data_referencia, valor)
               values ('ipca', '2000-01-01', 0.1) on conflict do nothing"""
        )

    def test_usuario_google_le_dados_mas_nao_tokens(self):
        self.garantir_valor_indicador()
        uid = self.criar_usuario("google")
        self.assertEqual(self.valor("select papel::text from perfis where user_id=%s", (uid,)), "usuario")
        with self.como("authenticated", uid):
            self.assertGreater(self.valor("select count(*) from indicadores_valores"), 0)
            self.assert_negado("select * from google_tokens")
            self.assertEqual(self.valor("select count(*) from coletas"), 0)
            self.assertEqual(self.valor("select count(*) from perfis"), 1)

    def test_bloqueado_nao_le_dados(self):
        uid = self.criar_usuario("google", "bloqueado")
        with self.como("authenticated", uid):
            self.assertEqual(self.valor("select count(*) from indicadores_valores"), 0)

    def test_usuario_nao_altera_papel(self):
        uid = self.criar_usuario("google")
        with self.como("authenticated", uid):
            alteradas = self.conexao.execute("update perfis set papel='admin' where user_id=%s", (uid,)).rowcount
        self.assertEqual(alteradas, 0)

    def test_admin_bloqueia_google_e_email_mas_nao_promove(self):
        admin = self.criar_usuario("email", "admin")
        alvo = self.criar_usuario("google")
        alvo_email = self.criar_usuario("email")
        outro_admin = self.criar_usuario("email", "admin")
        sem_acesso = self.criar_usuario("github")
        with self.como("authenticated", admin, aal="aal2"):
            self.assertEqual(self.conexao.execute("update perfis set papel='bloqueado' where user_id=%s", (alvo,)).rowcount, 1)
            self.assertEqual(self.conexao.execute("update perfis set papel='bloqueado' where user_id=%s", (alvo_email,)).rowcount, 1)
            self.assertEqual(self.conexao.execute("update perfis set papel='usuario' where user_id=%s", (alvo_email,)).rowcount, 1)
            self.assertEqual(self.conexao.execute("update perfis set papel='bloqueado' where user_id=%s", (outro_admin,)).rowcount, 0)
            self.assertEqual(self.conexao.execute("update perfis set papel='usuario' where user_id=%s", (sem_acesso,)).rowcount, 0)
            with self.assertRaises(psycopg.errors.InsufficientPrivilege):
                with self.conexao.transaction():
                    self.conexao.execute("update perfis set papel='admin' where user_id=%s", (alvo,))
            self.assertGreaterEqual(self.valor("select count(*) from saude_coleta()"), 7)

    def test_admin_sem_mfa_nao_tem_poderes(self):
        admin = self.criar_usuario("email", "admin")
        alvo = self.criar_usuario("google")
        with self.como("authenticated", admin, aal="aal1"):
            self.assertEqual(self.conexao.execute("update perfis set papel='bloqueado' where user_id=%s", (alvo,)).rowcount, 0)
            self.assertEqual(self.valor("select count(*) from indicadores_valores"), 0)
            self.assertEqual(self.valor("select count(*) from perfis"), 1)
            self.assert_negado("select * from saude_coleta()")

    def test_usuario_nao_ve_saude_coleta(self):
        uid = self.criar_usuario("google")
        with self.como("authenticated", uid):
            self.assert_negado("select * from saude_coleta()")

    def test_coletor_minimo_privilegio(self):
        # O postgres do Supabase não é superusuário; a concessão é desfeita no rollback do teste.
        self.conexao.execute("grant coletor_indicadores to postgres")
        with self.como("coletor_indicadores"):
            self.assert_negado("delete from indicadores_valores where false")
            self.assert_negado("select * from google_tokens")
            self.assert_negado("select * from perfis")
            self.assert_negado("select * from coletas")


class TestLimiteUso(BaseBanco):
    def consumir(self, chave: str = "assistente") -> bool:
        return self.valor("select consumir_limite(%s)", (chave,))

    def test_cota_fixa_do_proprio_usuario(self):
        uid = self.criar_usuario("email")
        outro = self.criar_usuario("google")
        with self.como("authenticated", uid):
            resultados = [self.consumir() for _ in range(21)]
            self.assert_negado("select * from limites_uso")
        self.assertEqual(resultados, [True] * 20 + [False])
        with self.como("authenticated", outro):
            self.assertTrue(self.consumir())

    def test_usuario_nao_altera_a_propria_cota(self):
        uid = self.criar_usuario("email")
        with self.como("authenticated", uid):
            with self.assertRaises(psycopg.errors.UndefinedFunction):  # máximo e janela não são parâmetros
                with self.conexao.transaction():
                    self.conexao.execute("select consumir_limite('assistente', 1, 1)")
            self.assert_negado("select * from cota_limite('assistente')")
            self.assert_negado("update limites_uso set contagem = 0")

    def test_janela_vencida_reinicia_a_contagem(self):
        uid = self.criar_usuario("email")
        self.conexao.execute(
            "insert into limites_uso values (%s, 'assistente', now() - interval '11 minutes', 99)", (uid,)
        )
        with self.como("authenticated", uid):
            self.assertTrue(self.consumir())

    def test_chave_desconhecida_e_anon(self):
        uid = self.criar_usuario("email")
        with self.como("authenticated", uid):
            with self.assertRaises(psycopg.errors.InvalidParameterValue):
                with self.conexao.transaction():
                    self.consumir("outra")
        with self.como("anon"):
            self.assert_negado("select consumir_limite('assistente')")


if __name__ == "__main__":
    unittest.main(verbosity=2)
