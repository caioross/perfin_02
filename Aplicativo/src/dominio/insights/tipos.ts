import type {
  CicloSelic,
  MetaInflacao,
  PontoInflacao,
  ResumoCambio,
  ResumoInflacao,
  ResumoJuros,
  SituacaoIndicador,
} from "@/tipos/indicadores";
import type { Insight } from "@/tipos/insights";

// Rendimento do CDI frente à inflação (função SQL rendimento_real_cdi a 100%), na mesma janela
// de meses fechados para os dois (inicio..fim).
export type CdiVersusInflacao = {
  inicio: string;
  fim: string;
  rendimento_nominal: number | null;
  ipca_periodo: number | null;
  rendimento_real: number | null;
};

// Tudo o que as regras de insight precisam, já calculado pela camada de dados.
export type DadosInsights = {
  meta: MetaInflacao | null;
  serieIpca: PontoInflacao[];
  inflacao: ResumoInflacao[];
  juros: ResumoJuros | null;
  ciclo: CicloSelic | null;
  cdiVersusInflacao: CdiVersusInflacao | null;
  cambioPeriodo: ResumoCambio[];
  cambio12m: ResumoCambio[];
  situacao: SituacaoIndicador[];
};

// Dados da Visão geral com os insights já gerados (fonte única para painel, relatório e assistente).
export type ResumoPainel = DadosInsights & { insights: Insight[] };
