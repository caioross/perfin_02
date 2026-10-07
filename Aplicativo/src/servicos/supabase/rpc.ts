import "server-only";
import { ErroValidacao } from "@/lib/erros";
import type { ClienteSupabase } from "./servidor";

// errcode 22023 (invalid_parameter_value): validação de entrada feita nas funções SQL,
// com mensagem em português segura para o usuário.
const CODIGO_VALIDACAO = "22023";

// Chama uma função SQL e devolve as linhas tipadas. Erros viram exceção (sem detalhes para a UI).
export async function chamarRpc<T>(
  supabase: ClienteSupabase,
  funcao: string,
  parametros: Record<string, unknown> = {},
): Promise<T[]> {
  const { data, error } = await supabase.rpc(funcao, parametros);
  if (error) {
    if (error.code === CODIGO_VALIDACAO) throw new ErroValidacao(error.message);
    throw new Error(`Falha na função ${funcao}: ${error.code ?? ""} ${error.message}`);
  }
  if (data == null) return [];
  return (Array.isArray(data) ? data : [data]) as T[];
}

export async function chamarRpcUnica<T>(
  supabase: ClienteSupabase,
  funcao: string,
  parametros: Record<string, unknown> = {},
): Promise<T | null> {
  const linhas = await chamarRpc<T>(supabase, funcao, parametros);
  return linhas[0] ?? null;
}
