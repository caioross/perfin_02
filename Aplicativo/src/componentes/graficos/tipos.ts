export type TipoSerie = "linha" | "barra" | "degrau";
export type FormatoGrafico = "percentual" | "cotacao" | "indice";

export type SerieGrafico = {
  chave: string;
  rotulo: string;
  cor: string;
  tipo: TipoSerie;
  tracejada?: boolean;
};

// Faixa sombreada entre duas colunas dos dados (ex.: piso e teto da meta de inflação).
export type FaixaGrafico = { chaveInferior: string; chaveSuperior: string; rotulo: string };

export type LinhaGrafico = Record<string, string | number | null>;

export type PropsGrafico = {
  titulo: string;
  dados: LinhaGrafico[];
  chaveX: string;
  formatoX: "mes" | "dia";
  series: SerieGrafico[];
  formato: FormatoGrafico;
  faixa?: FaixaGrafico;
  altura?: number;
};

// Paleta de tons médios, legível nos temas claro e escuro.
export const CORES = {
  ipca: "#2a9d8f",
  igpm: "#e76f51",
  inpc: "#8e7cc3",
  selic: "#3d85c6",
  cdi: "#2a9d8f",
  dolar: "#3d85c6",
  euro: "#c58b1b",
  media: "#8a96a3",
  faixa: "#2a9d8f",
} as const;
