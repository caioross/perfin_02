import "server-only";
import { fimDoMes, inicioDoMes, somarMeses } from "@/dominio/datas";
import type { Filtro } from "@/dominio/filtros";
import { gerarInsights, type DadosInsights } from "@/dominio/insights";
import type { CdiVersusInflacao, ResumoPainel } from "@/dominio/insights/tipos";
import { chamarRpc, chamarRpcUnica } from "@/servicos/supabase/rpc";
import { criarClienteServidor, type ClienteSupabase } from "@/servicos/supabase/servidor";
import type {
  CicloSelic,
  MetaInflacao,
  PontoInflacao,
  ResumoCambio,
  ResumoInflacao,
  ResumoJuros,
  SituacaoIndicador,
} from "@/tipos/indicadores";

export type { ResumoPainel } from "@/dominio/insights/tipos";

// Meses de IPCA buscados para as regras de tendência e de média mensal.
const MESES_HISTORICO_INSIGHTS = 16;

// CDI e IPCA na MESMA janela de meses fechados: do mês de início até o último mês com IPCA
// publicado (o IPCA do mês corrente ainda não existe). Sem meses fechados no período, não há insight.
async function buscarCdiVersusInflacao(
  supabase: ClienteSupabase,
  filtro: Filtro,
  ultimoMesIpca: string | null,
): Promise<CdiVersusInflacao | null> {
  const inicio = inicioDoMes(filtro.periodo.inicio);
  if (!ultimoMesIpca || ultimoMesIpca < inicio) return null;
  const fim = fimDoMes(ultimoMesIpca) < filtro.periodo.fim ? fimDoMes(ultimoMesIpca) : filtro.periodo.fim;
  const resultado = await chamarRpcUnica<Omit<CdiVersusInflacao, "inicio" | "fim">>(supabase, "rendimento_real_cdi", {
    p_valor: 1,
    p_percentual_cdi: 100,
    p_inicio: inicio,
    p_fim: fim,
  });
  return resultado ? { ...resultado, inicio, fim } : null;
}

// Reúne os dados da Visão geral e gera os insights do período (fonte única para painel,
// relatório e assistente).
// `incluirSituacao: false` em relatórios de meses passados: "dado desatualizado" reflete o
// estado de hoje, não o do mês do relatório.
export async function obterResumoPainel(filtro: Filtro, { incluirSituacao = true } = {}): Promise<ResumoPainel> {
  const supabase = await criarClienteServidor();
  const { inicio, fim } = filtro.periodo;
  const periodo = { p_inicio: inicio, p_fim: fim };
  const doze = { p_inicio: somarMeses(fim, -12), p_fim: fim };

  const [inflacao, meta, juros, ciclo, cambioPeriodo, cambio12m, situacao, serie] =
    await Promise.all([
      chamarRpc<ResumoInflacao>(supabase, "resumo_inflacao", periodo),
      chamarRpcUnica<MetaInflacao>(supabase, "status_meta_inflacao", { p_data: fim }),
      chamarRpcUnica<ResumoJuros>(supabase, "resumo_juros", periodo),
      chamarRpcUnica<CicloSelic>(supabase, "ciclo_selic", { p_data: fim }),
      chamarRpc<ResumoCambio>(supabase, "resumo_cambio", periodo),
      chamarRpc<ResumoCambio>(supabase, "resumo_cambio", doze),
      incluirSituacao ? chamarRpc<SituacaoIndicador>(supabase, "situacao_indicadores") : Promise.resolve([]),
      chamarRpc<PontoInflacao>(supabase, "serie_inflacao", {
        p_inicio: somarMeses(fim, -MESES_HISTORICO_INSIGHTS),
        p_fim: fim,
      }),
    ]);
  const ultimoMesIpca = inflacao.find((i) => i.indicador_codigo === "ipca")?.ultima_data ?? null;
  const cdiVersusInflacao = await buscarCdiVersusInflacao(supabase, filtro, ultimoMesIpca);

  const dados: DadosInsights = {
    meta,
    serieIpca: serie.filter((p) => p.indicador_codigo === "ipca"),
    inflacao,
    juros,
    ciclo,
    cdiVersusInflacao,
    cambioPeriodo,
    cambio12m,
    situacao,
  };
  return { ...dados, insights: gerarInsights(dados, filtro.indicadores) };
}
