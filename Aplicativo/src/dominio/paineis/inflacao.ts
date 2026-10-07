import type { CodigoInflacao, PontoInflacao } from "@/tipos/indicadores";

export type FaixaMetaAno = { ano: number; piso: number; teto: number };

// Uma linha por mês com os três índices lado a lado (para gráficos e tabela).
export type LinhaInflacao = {
  mes: string;
  ipca: number | null;
  igpm: number | null;
  inpc: number | null;
  ipca_12m: number | null;
  igpm_12m: number | null;
  inpc_12m: number | null;
  ipca_ano: number | null;
  piso: number | null;
  teto: number | null;
  // Regra C7: IGP-M 12m − IPCA 12m, em p.p. (arredondado a 6 casas, como no banco).
  spread_igpm_ipca: number | null;
};

function linhaVazia(mes: string): LinhaInflacao {
  return {
    mes, ipca: null, igpm: null, inpc: null, ipca_12m: null, igpm_12m: null, inpc_12m: null,
    ipca_ano: null, piso: null, teto: null, spread_igpm_ipca: null,
  };
}

function registrar(linha: LinhaInflacao, ponto: PontoInflacao) {
  const codigo: CodigoInflacao = ponto.indicador_codigo;
  linha[codigo] = ponto.valor;
  linha[`${codigo}_12m`] = ponto.acumulado_12m;
  if (codigo === "ipca") linha.ipca_ano = ponto.acumulado_ano;
}

export function pivotarInflacao(serie: PontoInflacao[], metas: FaixaMetaAno[]): LinhaInflacao[] {
  const porMes = new Map<string, LinhaInflacao>();
  for (const ponto of serie) {
    const linha = porMes.get(ponto.data_referencia) ?? linhaVazia(ponto.data_referencia);
    registrar(linha, ponto);
    porMes.set(ponto.data_referencia, linha);
  }
  const metaPorAno = new Map(metas.map((m) => [m.ano, m]));
  return [...porMes.values()]
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .map((linha) => {
      const meta = metaPorAno.get(Number(linha.mes.slice(0, 4)));
      const spread =
        linha.igpm_12m != null && linha.ipca_12m != null
          ? Math.round((linha.igpm_12m - linha.ipca_12m) * 1e6) / 1e6
          : null;
      return { ...linha, piso: meta?.piso ?? null, teto: meta?.teto ?? null, spread_igpm_ipca: spread };
    });
}
