import "server-only";
import type { Filtro } from "@/dominio/filtros";
import { chamarRpc, chamarRpcUnica } from "@/servicos/supabase/rpc";
import { criarClienteServidor } from "@/servicos/supabase/servidor";
import type {
  CicloSelic,
  DecisaoSelic,
  PontoDiario,
  PontoInflacao,
  PontoJurosMensal,
  ResumoCambio,
  ResumoInflacao,
  ResumoJuros,
} from "@/tipos/indicadores";

export type FaixaMeta = { ano: number; centro: number; piso: number; teto: number };

export type DadosInflacao = {
  serie: PontoInflacao[];
  resumo: ResumoInflacao[];
  metas: FaixaMeta[];
};

export async function obterDadosInflacao(filtro: Filtro): Promise<DadosInflacao> {
  const supabase = await criarClienteServidor();
  const periodo = { p_inicio: filtro.periodo.inicio, p_fim: filtro.periodo.fim };
  const [serie, resumo, metas] = await Promise.all([
    chamarRpc<PontoInflacao>(supabase, "serie_inflacao", periodo),
    chamarRpc<ResumoInflacao>(supabase, "resumo_inflacao", periodo),
    chamarRpc<FaixaMeta>(supabase, "faixas_meta_inflacao"),
  ]);
  return { serie, resumo, metas };
}

export type DadosJuros = {
  resumo: ResumoJuros | null;
  ciclo: CicloSelic | null;
  decisoes: DecisaoSelic[];
  mensal: PontoJurosMensal[];
  selicDiaria: PontoDiario[];
};

export async function obterDadosJuros(filtro: Filtro): Promise<DadosJuros> {
  const supabase = await criarClienteServidor();
  const periodo = { p_inicio: filtro.periodo.inicio, p_fim: filtro.periodo.fim };
  const [resumo, ciclo, decisoes, mensal, selicDiaria] = await Promise.all([
    chamarRpcUnica<ResumoJuros>(supabase, "resumo_juros", periodo),
    chamarRpcUnica<CicloSelic>(supabase, "ciclo_selic", { p_data: filtro.periodo.fim }),
    chamarRpc<DecisaoSelic>(supabase, "decisoes_selic", periodo),
    chamarRpc<PontoJurosMensal>(supabase, "serie_juros_mensal", periodo),
    chamarRpc<PontoDiario>(supabase, "serie_diaria", { p_codigos: ["selic"], ...periodo }),
  ]);
  return { resumo, ciclo, decisoes, mensal, selicDiaria };
}

export type DadosCambio = {
  resumo: ResumoCambio[];
  serie: PontoDiario[];
};

export async function obterDadosCambio(filtro: Filtro): Promise<DadosCambio> {
  const supabase = await criarClienteServidor();
  const periodo = { p_inicio: filtro.periodo.inicio, p_fim: filtro.periodo.fim };
  const codigos = filtro.indicadores.filter((c) => c === "dolar" || c === "euro");
  const [resumo, serie] = await Promise.all([
    chamarRpc<ResumoCambio>(supabase, "resumo_cambio", periodo),
    chamarRpc<PontoDiario>(supabase, "serie_diaria", { p_codigos: codigos, ...periodo }),
  ]);
  return { resumo: resumo.filter((r) => codigos.includes(r.indicador_codigo)), serie };
}
