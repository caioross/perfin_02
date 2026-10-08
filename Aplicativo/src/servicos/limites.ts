import "server-only";
import { registrarErro } from "@/lib/erros";
import { chamarRpcUnica } from "@/servicos/supabase/rpc";
import { criarClienteServidor } from "@/servicos/supabase/servidor";

export type ChaveLimite = "assistente";

// Consome uma unidade da cota do usuário logado. A cota de cada chave é fixa no banco
// (função cota_limite) e vale para todas as instâncias serverless. Falha fechada: erro = sem cota.
export async function consumirLimite(chave: ChaveLimite): Promise<boolean> {
  try {
    const supabase = await criarClienteServidor();
    return (await chamarRpcUnica<boolean>(supabase, "consumir_limite", { p_chave: chave })) === true;
  } catch (erro) {
    registrarErro(`limite ${chave}`, erro);
    return false;
  }
}
