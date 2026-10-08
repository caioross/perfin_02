"use server";

import { MUITAS_TENTATIVAS } from "@/dominio/auth/mensagens";
import { esquemaEmail } from "@/dominio/auth/validacao";
import { registrarErro } from "@/lib/erros";
import { permitirRequisicao } from "@/lib/limiteRequisicoes";
import { urlDoSite } from "@/lib/url";
import { criarClienteServidor } from "@/servicos/supabase/servidor";

export type EstadoRecuperacao = { erro: string | null; enviado: boolean };

// Envia o link de redefinição de senha. Resposta sempre igual (não revela se a conta existe).
export async function pedirRecuperacao(_estado: EstadoRecuperacao, formulario: FormData): Promise<EstadoRecuperacao> {
  const email = esquemaEmail.safeParse(formulario.get("email"));
  if (!email.success) return { erro: "Informe um e-mail válido.", enviado: false };
  if (!permitirRequisicao(`recuperacao:${email.data}`, 3, 60 * 60 * 1000)) {
    return { erro: MUITAS_TENTATIVAS, enviado: false };
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: urlDoSite("/auth/confirmar?type=recovery") });
  if (error) registrarErro("recuperar senha", error);
  return { erro: null, enviado: true };
}
