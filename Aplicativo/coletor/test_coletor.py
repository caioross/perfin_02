"""Testes das funções puras do coletor (sem rede e sem banco).

Uso:  python -m unittest discover -s Aplicativo/coletor -p "test_*.py"
"""

from __future__ import annotations

import unittest
from datetime import date
from decimal import Decimal

from coletor_indicadores import converter, intervalos


class TestIntervalos(unittest.TestCase):
    def test_periodo_curto_vira_um_bloco(self):
        self.assertEqual(intervalos(date(2024, 1, 1), date(2024, 12, 31)), [(date(2024, 1, 1), date(2024, 12, 31))])

    def test_blocos_contiguos_de_ate_cinco_anos(self):
        blocos = intervalos(date(2015, 1, 1), date(2026, 10, 8))
        self.assertEqual(blocos[0], (date(2015, 1, 1), date(2019, 12, 31)))
        self.assertEqual(blocos[-1][1], date(2026, 10, 8))
        for (_, fim), (inicio, _) in zip(blocos, blocos[1:]):
            self.assertEqual((inicio - fim).days, 1)

    def test_inicio_depois_do_fim_nao_gera_bloco(self):
        self.assertEqual(intervalos(date(2024, 2, 1), date(2024, 1, 1)), [])


class TestConverter(unittest.TestCase):
    def test_converte_data_e_valor_com_virgula(self):
        self.assertEqual(
            converter([{"data": "01/09/2024", "valor": "0,44"}, {"data": "02/09/2024", "valor": "5.6512"}]),
            [(date(2024, 9, 1), Decimal("0.44")), (date(2024, 9, 2), Decimal("5.6512"))],
        )

    def test_ignora_linhas_malformadas(self):
        registros = [{"data": "31/02/2024", "valor": "1"}, {"data": "01/03/2024", "valor": "abc"}, {"valor": "1"}]
        self.assertEqual(converter(registros), [])


if __name__ == "__main__":
    unittest.main()
