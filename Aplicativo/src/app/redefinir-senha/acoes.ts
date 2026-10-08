"use server";

import { redirect } from "next/navigation";
import { esquemaRedefinicao, lerCampos, primeiraMensagem } from "@/dominio/auth/validacao";
import { destinoAposLogin } from "@/lib/auth/destino";
import { MENSAGEM_ERRO_GENERICA, registrarErro } from "@/lib/erros";
import { criarClienteServidor } from "@/servicos/supabase/servidor";

export type EstadoRedefinicao = { erro: string | null };

// Define a nova senha da sessão aberta pelo link de recuperação (verifyOtp em /auth/confirmar).
export async function redefinirSenha(_estado: EstadoRedefinicao, formulario: FormData): Promise<EstadoRedefinicao> {
  const supabase = await criarClienteServidor();
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) return { erro: "O link expirou. Peça um novo em “Esqueci minha senha”." };

  const entrada = esquemaRedefinicao.safeParse(lerCampos(formulario, ["senha", "confirmacao"] as const));
  if (!entrada.success) return { erro: primeiraMensagem(entrada.error) };

  const { error } = await supabase.auth.updateUser({ password: entrada.data.senha });
  if (error?.code === "same_password") return { erro: "A nova senha precisa ser diferente da atual." };
  if (error?.code === "weak_password") return { erro: "Senha fraca ou muito comum. Escolha outra." };
  if (error) {
    registrarErro("redefinir senha", error);
    return { erro: MENSAGEM_ERRO_GENERICA };
  }
  redirect(await destinoAposLogin(supabase, sessao.user.id));
}
