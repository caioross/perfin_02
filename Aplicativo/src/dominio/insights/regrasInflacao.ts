import { formatarMes, formatarPercentual, formatarPontosPercentuais } from "@/lib/formatacao";
import type { MetaInflacao, PontoInflacao, ResumoInflacao } from "@/tipos/indicadores";
import type { Insight } from "@/tipos/insights";
import { MESES_MEDIA_MENSAL, MESES_TENDENCIA } from "./limites";

// Inflação × meta (regra C6).
export function regraMetaInflacao(meta: MetaInflacao | null): Insight | null {
  if (!meta || meta.ipca_12m == null || meta.piso == null || meta.teto == null || meta.centro == null) {
    return null;
  }
  const base = { id: "meta-inflacao", titulo: "Inflação × meta", indicadores: ["ipca" as const] };
  const ipca = formatarPercentual(meta.ipca_12m);
  if (meta.status === "acima_do_teto") {
    const excesso = meta.ipca_12m - meta.teto;
    return {
      ...base,
      severidade: "alerta",
      relevancia: excesso,
      texto: `IPCA 12m em ${ipca}, ${formatarPontosPercentuais(excesso, false)} acima do teto da meta (${formatarPercentual(meta.teto)}).`,
    };
  }
  if (meta.status === "abaixo_do_piso") {
    const falta = meta.piso - meta.ipca_12m;
    return {
      ...base,
      severidade: "atencao",
      relevancia: falta,
      texto: `IPCA 12m em ${ipca}, ${formatarPontosPercentuais(falta, false)} abaixo do piso da meta (${formatarPercentual(meta.piso)}).`,
    };
  }
  return {
    ...base,
    severidade: "informativo",
    relevancia: Math.abs(meta.distancia_centro ?? 0),
    texto: `IPCA 12m em ${ipca}, dentro da meta (${formatarPercentual(meta.piso)} a ${formatarPercentual(meta.teto)}).`,
  };
}

// Tamanho da sequência final de altas (+) ou quedas (−) do IPCA 12m.
export function sequenciaFinal(valores: number[]): number {
  let contagem = 0;
  let direcao = 0;
  for (let i = valores.length - 1; i > 0; i--) {
    const passo = Math.sign(valores[i] - valores[i - 1]);
    if (passo === 0 || (direcao !== 0 && passo !== direcao)) break;
    direcao = passo;
    contagem += 1;
  }
  return contagem * direcao;
}

// Tendência: IPCA 12m subindo ou caindo há pelo menos MESES_TENDENCIA meses seguidos.
export function regraTendenciaInflacao(serieIpca: PontoInflacao[]): Insight | null {
  const valores = serieIpca.map((p) => p.acumulado_12m).filter((v): v is number => v != null);
  const sequencia = sequenciaFinal(valores);
  if (Math.abs(sequencia) < MESES_TENDENCIA) return null;
  const acelerando = sequencia > 0;
  return {
    id: "tendencia-inflacao",
    titulo: "Tendência da inflação",
    indicadores: ["ipca"],
    severidade: acelerando ? "atencao" : "informativo",
    relevancia: Math.abs(sequencia),
    texto: `A inflação em 12 meses ${acelerando ? "acelera" : "desacelera"} há ${Math.abs(sequencia)} meses.`,
  };
}

// IPCA do último mês comparado à média mensal dos MESES_MEDIA_MENSAL meses anteriores.
export function regraMesAcimaDoPadrao(serieIpca: PontoInflacao[]): Insight | null {
  if (serieIpca.length < MESES_MEDIA_MENSAL + 1) return null;
  const ultimo = serieIpca[serieIpca.length - 1];
  const anteriores = serieIpca.slice(-(MESES_MEDIA_MENSAL + 1), -1);
  const media = anteriores.reduce((soma, p) => soma + p.valor, 0) / anteriores.length;
  if (ultimo.valor === media) return null;
  const acima = ultimo.valor > media;
  return {
    id: "ipca-mes-padrao",
    titulo: "IPCA do mês",
    indicadores: ["ipca"],
    severidade: acima ? "atencao" : "informativo",
    relevancia: Math.abs(ultimo.valor - media),
    texto: `IPCA de ${formatarMes(ultimo.data_referencia).toLowerCase()} (${formatarPercentual(ultimo.valor)}) ficou ${acima ? "acima" : "abaixo"} da média dos últimos ${MESES_MEDIA_MENSAL} meses (${formatarPercentual(media)}).`,
  };
}

// Aluguel (regra C7): IGP-M 12m × IPCA 12m e sinal do IGP-M.
export function regraAluguel(inflacao: ResumoInflacao[]): Insight | null {
  const igpm = inflacao.find((i) => i.indicador_codigo === "igpm")?.acumulado_12m;
  const ipca = inflacao.find((i) => i.indicador_codigo === "ipca")?.acumulado_12m;
  if (igpm == null || ipca == null || igpm === ipca) return null;
  const spread = Math.round((igpm - ipca) * 100) / 100;
  const favorece = igpm < ipca ? "favorece o inquilino" : "favorece o proprietário";
  return {
    id: "aluguel-igpm-ipca",
    titulo: "Reajuste de aluguel",
    indicadores: ["igpm", "ipca"],
    severidade: igpm < 0 ? "atencao" : "informativo",
    relevancia: Math.abs(spread),
    texto: `IGP-M 12m (${formatarPercentual(igpm)}) ${igpm < ipca ? "abaixo" : "acima"} do IPCA (${formatarPercentual(ipca)}), diferença de ${formatarPontosPercentuais(spread)}: reajuste pelo IGP-M ${favorece}.`,
  };
}
