import "server-only";
import { registrarErro } from "@/lib/erros";
import { chamarRpcUnica } from "@/servicos/supabase/rpc";
import { criarClienteServidor } from "@/servicos/supabase/servidor";

// Consome uma unidade da cota do usuário logado (função consumir_limite, no banco, válida para
// todas as instâncias serverless). Falha fechada: erro ao consultar = sem cota.
export async function consumirLimite(chave: string, maximo: number, janelaSegundos: number): Promise<boolean> {
  try {
    const supabase = await criarClienteServidor();
    const permitido = await chamarRpcUnica<boolean>(supabase, "consumir_limite", {
      p_chave: chave,
      p_maximo: maximo,
      p_janela_segundos: janelaSegundos,
    });
    return permitido === true;
  } catch (erro) {
    registrarErro(`limite ${chave}`, erro);
    return false;
  }
}
