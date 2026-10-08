"use server";

import { redirect } from "next/navigation";
import { tipoLinkEmail } from "@/dominio/auth/rotas";
import { destinoAposLogin } from "@/lib/auth/destino";
import { registrarErro } from "@/lib/erros";
import { criarClienteServidor } from "@/servicos/supabase/servidor";

// Valida o link recebido por e-mail (confirmação de cadastro ou recuperação de senha).
// Roda só quando a pessoa clica em "Continuar" (POST): leitores de link dos provedores de e-mail
// abrem a URL com GET e não podem gastar o token.
// Formato principal (template do Supabase): token_hash + type; alternativa PKCE: code.
export async function confirmarLink(formulario: FormData): Promise<void> {
  const tokenHash = String(formulario.get("token_hash") ?? "");
  const tipo = tipoLinkEmail(String(formulario.get("type") ?? ""));
  const codigo = String(formulario.get("code") ?? "");

  const supabase = await criarClienteServidor();
  let userId: string | undefined;
  if (tokenHash && tipo) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo });
    if (error) registrarErro("confirmar link", error);
    userId = data.user?.id;
  } else if (codigo) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (error) registrarErro("confirmar código", error);
    userId = data.user?.id;
  }
  if (!userId) redirect("/login?erro=link");

  if (tipo === "recovery") redirect("/redefinir-senha");
  redirect(await destinoAposLogin(supabase, userId));
}
