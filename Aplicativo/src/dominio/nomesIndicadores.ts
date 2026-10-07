import type { CodigoIndicador } from "@/tipos/indicadores";

// Nomes curtos dos indicadores para a interface (o catálogo completo está na tabela `indicadores`).
export const NOMES_INDICADORES: Record<CodigoIndicador, string> = {
  ipca: "IPCA",
  igpm: "IGP-M",
  inpc: "INPC",
  selic: "Selic",
  cdi: "CDI",
  dolar: "Dólar",
  euro: "Euro",
};
