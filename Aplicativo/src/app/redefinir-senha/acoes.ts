"use server";

import { redirect } from "next/navigation";
import { LINK_EXPIRADO, SENHA_FRACA } from "@/dominio/auth/mensagens";
import { esquemaRedefinicao, lerCampos, primeiraMensagem } from "@/dominio/auth/validacao";
import { destinoAposLogin } from "@/lib/auth/destino";
import { obterSessaoDeRecuperacao } from "@/lib/auth/recuperacao";
import { MENSAGEM_ERRO_GENERICA, registrarErro } from "@/lib/erros";

export type EstadoRedefinicao = { erro: string | null };

// Define a nova senha. Só vale para a sessão aberta pelo link de recuperação (amr "recovery"),
// nunca para uma sessão comum: trocar a senha sem a senha atual exige ter recebido o e-mail.
export async function redefinirSenha(_estado: EstadoRedefinicao, formulario: FormData): Promise<EstadoRedefinicao> {
  const sessao = await obterSessaoDeRecuperacao();
  if (!sessao) return { erro: LINK_EXPIRADO };

  const entrada = esquemaRedefinicao.safeParse(lerCampos(formulario, ["senha", "confirmacao"] as const));
  if (!entrada.success) return { erro: primeiraMensagem(entrada.error) };

  const { supabase, userId } = sessao;
  const { error } = await supabase.auth.updateUser({ password: entrada.data.senha });
  if (error?.code === "same_password") return { erro: "A nova senha precisa ser diferente da atual." };
  if (error?.code === "weak_password") return { erro: SENHA_FRACA };
  if (error?.code === "insufficient_aal") {
    return { erro: "Por segurança, a senha do administrador é redefinida pelo painel do Supabase." };
  }
  if (error) {
    registrarErro("redefinir senha", error);
    return { erro: MENSAGEM_ERRO_GENERICA };
  }
  redirect(await destinoAposLogin(supabase, userId));
}
