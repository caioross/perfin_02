import { formatarMes, formatarMesCurto } from "@/lib/formatacao";
import type { ResumoPainel } from "@/dominio/insights/tipos";
import type { AbaPlanilha, CelulaPlanilha, ConteudoPlanilha } from "@/tipos/google";
import type { DecisaoSelic, PontoInflacao, PontoJurosMensal, ResumoCambio } from "@/tipos/indicadores";

// Monta o conteúdo da Planilha Google do relatório mensal (§6 das regras de negócio).
// Os números vêm prontos do banco; aqui só organizamos linhas e colunas.

export type DadosRelatorio = {
  mesReferencia: string;
  resumo: ResumoPainel;
  serieInflacao12m: PontoInflacao[];
  jurosMes: PontoJurosMensal | null;
  decisoesMes: DecisaoSelic[];
  cambioMes: ResumoCambio[];
  ultimaColeta: string | null;
};

const NOMES: Record<string, string> = {
  ipca: "IPCA", igpm: "IGP-M", inpc: "INPC", dolar: "Dólar (PTAX venda)", euro: "Euro (PTAX venda)",
};

const STATUS_META: Record<string, string> = {
  abaixo_do_piso: "Abaixo do piso",
  dentro_da_meta: "Dentro da meta",
  acima_do_teto: "Acima do teto",
  sem_dados: "Sem dados",
  meta_nao_cadastrada: "Meta não cadastrada",
};

function abaResumo(dados: DadosRelatorio): AbaPlanilha {
  const { resumo } = dados;
  const ipca = resumo.inflacao.find((i) => i.indicador_codigo === "ipca");
  const linhas: CelulaPlanilha[][] = [
    ["Indicador", "Valor", "Observação"],
    ["Mês de referência", formatarMes(dados.mesReferencia), null],
    ["IPCA do mês (%)", ipca?.valor_mes ?? null, null],
    ["IPCA 12 meses (%)", resumo.meta?.ipca_12m ?? null, STATUS_META[resumo.meta?.status ?? "sem_dados"]],
    ["Meta: centro / piso / teto (%)", resumo.meta?.centro ?? null, `${resumo.meta?.piso ?? "—"} a ${resumo.meta?.teto ?? "—"}`],
    ["Selic meta (% a.a.)", resumo.juros?.selic_atual ?? null, null],
    ["CDI 12 meses (%)", resumo.juros?.cdi_12m ?? null, null],
    ["Juro real 12 meses (%)", resumo.juros?.juro_real_12m ?? null, "Fisher: (1 + CDI) / (1 + IPCA) − 1"],
    [],
    ["Destaques do mês", null, null],
    ...resumo.insights.map((insight) => [insight.titulo, insight.texto, null] as CelulaPlanilha[]),
  ];
  return { titulo: "Resumo", linhas };
}

function abaInflacao(serie: PontoInflacao[]): AbaPlanilha {
  const linhas: CelulaPlanilha[][] = [["Mês", "Índice", "Variação no mês (%)", "Acumulado no ano (%)", "Acumulado 12 meses (%)"]];
  for (const ponto of serie) {
    linhas.push([formatarMesCurto(ponto.data_referencia), NOMES[ponto.indicador_codigo], ponto.valor, ponto.acumulado_ano, ponto.acumulado_12m]);
  }
  return { titulo: "Inflação", linhas };
}

function abaJuros(dados: DadosRelatorio): AbaPlanilha {
  const j = dados.jurosMes;
  const linhas: CelulaPlanilha[][] = [
    ["Indicador", "Valor (%)"],
    ["Selic meta no fim do mês (% a.a.)", j?.selic ?? null],
    ["CDI no mês", j?.cdi_mes ?? null],
    ["CDI 12 meses", j?.cdi_12m ?? null],
    ["IPCA 12 meses", j?.ipca_12m ?? null],
    ["Juro real 12 meses", j?.juro_real_12m ?? null],
    [],
    ["Decisões da Selic no mês", "De (% a.a.)", "Para (% a.a.)", "Variação (p.p.)"],
    ...dados.decisoesMes.map((d) => [d.data_referencia, d.anterior, d.novo, d.variacao_pp] as CelulaPlanilha[]),
  ];
  if (dados.decisoesMes.length === 0) linhas.push(["Sem mudança da Selic no mês", null, null, null]);
  return { titulo: "Juros", linhas };
}

function abaCambio(cambio: ResumoCambio[]): AbaPlanilha {
  const linhas: CelulaPlanilha[][] = [
    ["Moeda", "Fechamento (R$)", "Média (R$)", "Mínima (R$)", "Máxima (R$)", "Variação no mês (%)", "Variação no ano (%)", "Variação 12 meses (%)"],
  ];
  for (const m of cambio) {
    linhas.push([NOMES[m.indicador_codigo], m.ultimo_valor, m.media, m.minimo, m.maximo, m.variacao_mes, m.variacao_ano, m.variacao_12m]);
  }
  return { titulo: "Câmbio", linhas };
}

function abaMetodologia(ultimaColeta: string | null): AbaPlanilha {
  return {
    titulo: "Metodologia",
    linhas: [
      ["Item", "Descrição"],
      ["Fonte", "Banco Central do Brasil — SGS (IPCA 433, IGP-M 189, INPC 188, Selic meta 432, CDI 12, Dólar 1, Euro 21619)"],
      ["Acumulados", "(∏(1 + taxa/100) − 1) × 100 — taxas são compostas, nunca somadas"],
      ["CDI acumulado", "Produto das taxas diárias; anualizado = (1 + taxa diária)^252 − 1"],
      ["Juro real", "Fisher ex-post: (1 + CDI 12m) / (1 + IPCA 12m) − 1"],
      ["Meta de inflação", "Centro e tolerância definidos pelo CMN para o ano do mês de referência"],
      ["Câmbio", "Variação = último ÷ primeiro − 1; volatilidade = desvio dos retornos log diários × √252"],
      ["Dados ausentes", "Mês ainda não publicado não é estimado (aparece vazio)"],
      ["Última coleta", ultimaColeta ?? "—"],
    ],
  };
}

export function montarPlanilhaRelatorio(dados: DadosRelatorio): ConteudoPlanilha {
  return {
    titulo: `Perfin — Indicadores ${formatarMesCurto(dados.mesReferencia)}`,
    abas: [
      abaResumo(dados),
      abaInflacao(dados.serieInflacao12m),
      abaJuros(dados),
      abaCambio(dados.cambioMes),
      abaMetodologia(dados.ultimaColeta),
    ],
  };
}

// Corpo do rascunho de e-mail: 3 a 5 destaques e o link da planilha.
export function montarCorpoEmail(dados: Pick<DadosRelatorio, "mesReferencia" | "resumo">, linkPlanilha: string): string {
  const destaques = dados.resumo.insights.slice(0, 5).map((i) => `• ${i.texto}`);
  return [
    "Olá,",
    "",
    `Segue o relatório de indicadores econômicos de ${formatarMes(dados.mesReferencia).toLowerCase()}.`,
    "",
    "Destaques:",
    ...destaques,
    "",
    `Planilha no Google Drive: ${linkPlanilha}`,
    "O arquivo .xlsx está anexado.",
    "",
    "Fonte: Banco Central do Brasil (SGS). Gerado pelo Portal Perfin.",
  ].join("\n");
}
