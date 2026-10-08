"use server";

import { redirect } from "next/navigation";
import { CREDENCIAIS_INVALIDAS, MUITAS_TENTATIVAS, SERVICO_INDISPONIVEL } from "@/dominio/auth/mensagens";
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

// Login por e-mail e senha (usuários e admin). Mensagem sempre genérica; o admin segue para o MFA.
// "E-mail não confirmado" só aparece com a senha certa, então não revela quais contas existem.
export async function entrarComEmail(_estado: EstadoLogin, formulario: FormData): Promise<EstadoLogin> {
  const campos = lerCampos(formulario, ["email", "senha"] as const);
  const falha = (erro: string): EstadoLogin => ({ erro, emailNaoConfirmado: null, email: campos.email });
  const entrada = esquemaLogin.safeParse(campos);
  if (!entrada.success) return falha(CREDENCIAIS_INVALIDAS);
  const { email, senha } = entrada.data;
  if (!permitirRequisicao(`login:${email}`, 5, 15 * 60 * 1000)) {
    return falha(MUITAS_TENTATIVAS);
  }

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error?.code === "email_not_confirmed") {
    return { erro: "Confirme seu e-mail para entrar. O link foi enviado no cadastro.", emailNaoConfirmado: email, email };
  }
  if (error?.code === "invalid_credentials") return falha(CREDENCIAIS_INVALIDAS);
  if (error?.code === "over_request_rate_limit") return falha(MUITAS_TENTATIVAS);
  if (error || !data.user) {
    registrarErro("login e-mail", error);
    return falha(SERVICO_INDISPONIVEL);
  }
  redirect(await destinoAposLogin(supabase, data.user.id));
}

export async function sair(): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
