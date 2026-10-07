import { formatarCotacao, formatarData, formatarMesCurto, formatarPercentual, formatarPontosPercentuais } from "@/lib/formatacao";
import type { CicloSelic, ResumoCambio, ResumoJuros, SituacaoIndicador } from "@/tipos/indicadores";
import type { Insight } from "@/tipos/insights";
import { JURO_REAL_NEGATIVO, JURO_REAL_RESTRITIVO, MULTIPLO_VOLATILIDADE, VARIACAO_CAMBIO_MES } from "./limites";
import type { CdiVersusInflacao } from "./tipos";

// Juro real ex-post 12m (regra C5).
export function regraJuroReal(juros: ResumoJuros | null): Insight | null {
  const real = juros?.juro_real_12m;
  if (real == null) return null;
  const base = { id: "juro-real", titulo: "Juro real", indicadores: ["cdi" as const, "ipca" as const, "selic" as const] };
  const valor = formatarPercentual(real);
  if (real > JURO_REAL_RESTRITIVO) {
    return { ...base, severidade: "atencao", relevancia: real - JURO_REAL_RESTRITIVO,
      texto: `Juro real de ${valor} a.a. em 12 meses: política monetária restritiva.` };
  }
  if (real < JURO_REAL_NEGATIVO) {
    return { ...base, severidade: "alerta", relevancia: JURO_REAL_NEGATIVO - real,
      texto: `Juro real negativo (${valor} a.a. em 12 meses): o CDI perdeu para a inflação.` };
  }
  return { ...base, severidade: "informativo", relevancia: real,
    texto: `Juro real de ${valor} a.a. em 12 meses.` };
}

// Ciclo da Selic (regra C8).
export function regraCicloSelic(ciclo: CicloSelic | null): Insight | null {
  if (!ciclo || ciclo.selic_atual == null) return null;
  const selic = formatarPercentual(ciclo.selic_atual);
  const ultima = ciclo.ultima_decisao
    ? `; última mudança em ${formatarData(ciclo.ultima_decisao)} (${formatarPontosPercentuais(ciclo.ultima_variacao_pp)})`
    : "";
  const textos = {
    alta: `Selic em ${selic} após ${ciclo.decisoes_seguidas} alta(s) seguida(s)${ultima}.`,
    queda: `Selic em ${selic} após ${ciclo.decisoes_seguidas} queda(s) seguida(s)${ultima}.`,
    manutencao: `Selic mantida em ${selic}${ultima}.`,
  };
  return {
    id: "ciclo-selic",
    titulo: "Ciclo da Selic",
    indicadores: ["selic"],
    severidade: "informativo",
    relevancia: ciclo.decisoes_seguidas,
    texto: textos[ciclo.direcao],
  };
}

// CDI × inflação no período (regras C4 e C13).
export function regraCdiVersusInflacao(dados: CdiVersusInflacao | null): Insight | null {
  if (!dados || dados.rendimento_nominal == null || dados.ipca_periodo == null || dados.rendimento_real == null) {
    return null;
  }
  const ganhou = dados.rendimento_real >= 0;
  return {
    id: "cdi-inflacao",
    titulo: "CDI × inflação",
    indicadores: ["cdi", "ipca"],
    severidade: ganhou ? "informativo" : "alerta",
    relevancia: Math.abs(dados.rendimento_real),
    texto: `De ${formatarMesCurto(dados.inicio)} a ${formatarMesCurto(dados.fim)}, o CDI rendeu ${formatarPercentual(dados.rendimento_nominal)} contra ${formatarPercentual(dados.ipca_periodo)} de inflação: ${ganhou ? "ganho" : "perda"} real de ${formatarPercentual(Math.abs(dados.rendimento_real))}.`,
  };
}

const NOMES_MOEDA = { dolar: "Dólar", euro: "Euro" } as const;

// Câmbio (regra C9): variação forte no mês, máxima/mínima de 12 meses e volatilidade.
export function regrasCambio(periodo: ResumoCambio[], dozeMeses: ResumoCambio[]): Insight[] {
  return periodo.flatMap((moeda) => {
    const nome = NOMES_MOEDA[moeda.indicador_codigo];
    const partes: string[] = [];
    let severidade: Insight["severidade"] = "informativo";
    let relevancia = 0;
    const variacao = moeda.variacao_mes;
    if (variacao != null && Math.abs(variacao) >= VARIACAO_CAMBIO_MES) {
      partes.push(`${variacao > 0 ? "subiu" : "caiu"} ${formatarPercentual(Math.abs(variacao))} no mês`);
      severidade = "atencao";
      relevancia = Math.abs(variacao) - VARIACAO_CAMBIO_MES;
    }
    if (moeda.maximo_12m != null && moeda.ultimo_valor >= moeda.maximo_12m) {
      partes.push(`atingiu a máxima de 12 meses (${formatarCotacao(moeda.ultimo_valor)})`);
      severidade = "atencao";
    } else if (moeda.minimo_12m != null && moeda.ultimo_valor <= moeda.minimo_12m) {
      partes.push(`atingiu a mínima de 12 meses (${formatarCotacao(moeda.ultimo_valor)})`);
    }
    const vol12m = dozeMeses.find((m) => m.indicador_codigo === moeda.indicador_codigo)?.volatilidade_anual;
    if (moeda.volatilidade_anual != null && vol12m != null && moeda.volatilidade_anual > vol12m * MULTIPLO_VOLATILIDADE) {
      partes.push(`com volatilidade acima da média de 12 meses (${formatarPercentual(moeda.volatilidade_anual)} contra ${formatarPercentual(vol12m)})`);
    }
    if (partes.length === 0) return [];
    return [{
      id: `cambio-${moeda.indicador_codigo}`,
      titulo: `Câmbio: ${nome.toLowerCase()}`,
      indicadores: [moeda.indicador_codigo],
      severidade,
      relevancia,
      texto: `${nome} ${partes.join(", ")}.`,
    }];
  });
}

// Dados desatualizados (mensal > 45 dias; diário > 5 dias úteis), calculado no banco.
export function regrasDadosDesatualizados(situacao: SituacaoIndicador[]): Insight[] {
  return situacao
    .filter((s) => s.desatualizado)
    .map((s) => ({
      id: `desatualizado-${s.indicador_codigo}`,
      titulo: "Dado desatualizado",
      indicadores: [s.indicador_codigo],
      severidade: "alerta" as const,
      relevancia: 0,
      texto: s.ultima_data
        ? `${s.nome} sem atualização desde ${formatarData(s.ultima_data)}.`
        : `${s.nome} ainda sem dados coletados.`,
    }));
}
