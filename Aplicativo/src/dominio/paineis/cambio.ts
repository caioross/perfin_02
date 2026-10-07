import type { PontoDiario } from "@/tipos/indicadores";

export type LinhaCambio = { data: string } & Record<string, number | string | null>;

// Uma linha por dia com cada moeda e sua média móvel de 21 dias úteis (colunas <codigo> e <codigo>_mm21).
export function pivotarSerieDiaria(serie: PontoDiario[]): LinhaCambio[] {
  const porDia = new Map<string, LinhaCambio>();
  for (const ponto of serie) {
    const linha = porDia.get(ponto.data_referencia) ?? { data: ponto.data_referencia };
    linha[ponto.indicador_codigo] = ponto.valor;
    linha[`${ponto.indicador_codigo}_mm21`] = ponto.media_movel_21;
    porDia.set(ponto.data_referencia, linha);
  }
  return [...porDia.values()].sort((a, b) => a.data.localeCompare(b.data));
}
