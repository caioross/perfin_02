import "server-only";
import { chamarRpc } from "@/servicos/supabase/rpc";
import { criarClienteServidor } from "@/servicos/supabase/servidor";
import type { CodigoInflacao } from "@/tipos/indicadores";

// Calculadoras (regras C10–C13). Os cálculos são feitos no banco com numeric; erros de
// validação do banco viram ErroValidacao em chamarRpc.
async function calcular<T>(funcao: string, parametros: Record<string, unknown>): Promise<T[]> {
  return chamarRpc<T>(await criarClienteServidor(), funcao, parametros);
}

export type ResultadoCorrecao = { percentual: number | null; valor_corrigido: number | null; mes_inicio: string; mes_fim: string };
export type ResultadoReajuste = {
  indicador_codigo: CodigoInflacao;
  nome: string;
  periodo_inicio: string;
  periodo_fim: string;
  percentual: number | null;
  novo_valor: number | null;
};
export type ResultadoPoderCompra = { inflacao: number | null; valor_equivalente: number | null; perda_poder_compra: number | null };
export type ResultadoRendimento = {
  rendimento_nominal: number | null;
  ipca_periodo: number | null;
  ipca_ate: string | null;
  ipca_parcial: boolean;
  rendimento_real: number | null;
  valor_final: number | null;
  ganho_nominal: number | null;
};

export async function corrigirValor(codigo: CodigoInflacao, valor: number, mesInicio: string, mesFim: string) {
  const [linha] = await calcular<ResultadoCorrecao>("corrigir_valor", {
    p_codigo: codigo, p_valor: valor, p_mes_inicio: mesInicio, p_mes_fim: mesFim,
  });
  return linha ?? null;
}

export async function reajusteContrato(valor: number, mesAniversario: string) {
  return calcular<ResultadoReajuste>("reajuste_contrato", { p_valor: valor, p_mes_aniversario: mesAniversario });
}

export async function poderDeCompra(valor: number, mesInicio: string, mesFim: string) {
  const [linha] = await calcular<ResultadoPoderCompra>("poder_de_compra", {
    p_valor: valor, p_mes_inicio: mesInicio, p_mes_fim: mesFim,
  });
  return linha ?? null;
}

export async function rendimentoRealCdi(valor: number, percentualCdi: number, inicio: string, fim: string) {
  const [linha] = await calcular<ResultadoRendimento>("rendimento_real_cdi", {
    p_valor: valor, p_percentual_cdi: percentualCdi, p_inicio: inicio, p_fim: fim,
  });
  return linha ?? null;
}
