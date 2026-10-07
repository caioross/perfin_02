import type { CodigoIndicador } from "./indicadores";

export type Severidade = "alerta" | "atencao" | "informativo";

export type Insight = {
  id: string;
  severidade: Severidade;
  titulo: string;
  texto: string;
  // Indicadores relacionados: o insight só aparece se algum deles estiver no filtro.
  indicadores: CodigoIndicador[];
  // Tamanho do desvio em relação ao limite da regra, usado para ordenar dentro da severidade.
  relevancia: number;
};
