"use server";

import { redirect } from "next/navigation";
import { esquemaLogin, lerCampos } from "@/dominio/auth/validacao";
import { destinoAposLogin } from "@/lib/auth/destino";
import { ESCOPOS_GOOGLE } from "@/lib/auth/escoposGoogle";
import { registrarErro } from "@/lib/erros";
import { permitirRequisicao } from "@/lib/limiteRequisicoes";
import { urlDoSite } from "@/lib/url";
import { criarClienteServidor } from "@/servicos/supabase/servidor";

export type EstadoLogin = { erro: string | null; emailNaoConfirmado: string | null; email: string };

// Login Google (entrar ou cadastrar). Pede acesso offline para obter o refresh token das APIs Google.
export async function entrarComGoogle(): Promise<void> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: urlDoSite("/auth/callback"),
      scopes: ESCOPOS_GOOGLE.join(" "),
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
  if (error || !data.url) {
    registrarErro("login google", error);
    redirect("/login?erro=google");
  }
  redirect(data.url);
}

const MENSAGEM_CREDENCIAIS = "E-mail ou senha inválidos.";

// Login por e-mail e senha (usuários e admin). Mensagem sempre genérica; o admin segue para o MFA.
// "E-mail não confirmado" só aparece com a senha certa, então não revela quais contas existem.
export async function entrarComEmail(_estado: EstadoLogin, formulario: FormData): Promise<EstadoLogin> {
  const campos = lerCampos(formulario, ["email", "senha"] as const);
  const falha = (erro: string): EstadoLogin => ({ erro, emailNaoConfirmado: null, email: campos.email });
  const entrada = esquemaLogin.safeParse(campos);
  if (!entrada.success) return falha(MENSAGEM_CREDENCIAIS);
  const { email, senha } = entrada.data;
  if (!permitirRequisicao(`login:${email}`, 5, 15 * 60 * 1000)) {
    return falha("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
  }

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error?.code === "email_not_confirmed") {
    return { erro: "Confirme seu e-mail para entrar. O link foi enviado no cadastro.", emailNaoConfirmado: email, email };
  }
  if (error || !data.user) return falha(MENSAGEM_CREDENCIAIS);
  redirect(await destinoAposLogin(supabase, data.user.id));
}

export async function sair(): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
