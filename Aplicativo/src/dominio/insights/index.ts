import type { CodigoIndicador } from "@/tipos/indicadores";
import type { Insight, Severidade } from "@/tipos/insights";
import { regraAluguel, regraMesAcimaDoPadrao, regraMetaInflacao, regraTendenciaInflacao } from "./regrasInflacao";
import {
  regraCdiVersusInflacao,
  regraCicloSelic,
  regraJuroReal,
  regrasCambio,
  regrasDadosDesatualizados,
} from "./regrasMercado";
import type { DadosInsights } from "./tipos";

export type { DadosInsights } from "./tipos";

const ORDEM_SEVERIDADE: Record<Severidade, number> = { alerta: 0, atencao: 1, informativo: 2 };

export function ordenarInsights(insights: Insight[]): Insight[] {
  return [...insights].sort(
    (a, b) => ORDEM_SEVERIDADE[a.severidade] - ORDEM_SEVERIDADE[b.severidade] || b.relevancia - a.relevancia,
  );
}

// Gera os insights do período, ordenados por severidade e relevância, mostrando apenas
// os relacionados aos indicadores do filtro.
export function gerarInsights(dados: DadosInsights, indicadoresDoFiltro: CodigoIndicador[]): Insight[] {
  const candidatos = [
    regraMetaInflacao(dados.meta),
    regraTendenciaInflacao(dados.serieIpca),
    regraMesAcimaDoPadrao(dados.serieIpca),
    regraJuroReal(dados.juros),
    regraCicloSelic(dados.ciclo),
    regraCdiVersusInflacao(dados.cdiVersusInflacao),
    regraAluguel(dados.inflacao),
    ...regrasCambio(dados.cambioPeriodo, dados.cambio12m),
    ...regrasDadosDesatualizados(dados.situacao),
  ];
  const selecionados = new Set(indicadoresDoFiltro);
  const visiveis = candidatos.filter(
    (insight): insight is Insight => insight !== null && insight.indicadores.some((c) => selecionados.has(c)),
  );
  return ordenarInsights(visiveis);
}
