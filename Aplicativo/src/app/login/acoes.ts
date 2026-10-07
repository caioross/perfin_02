"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ESCOPOS_GOOGLE } from "@/lib/auth/escoposGoogle";
import { registrarErro } from "@/lib/erros";
import { permitirRequisicao } from "@/lib/limiteRequisicoes";
import { urlDoSite } from "@/lib/url";
import { criarClienteServidor } from "@/servicos/supabase/servidor";

export type EstadoLogin = { erro: string | null };

// Login Google (usuários). Pede acesso offline para obter o refresh token das APIs Google.
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

const esquemaAdmin = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  senha: z.string().min(1).max(200),
});

const MENSAGEM_CREDENCIAIS = "E-mail ou senha inválidos.";

// Login do admin (e-mail e senha). Mensagem sempre genérica; o MFA é exigido em seguida.
export async function entrarComoAdmin(_estado: EstadoLogin, formulario: FormData): Promise<EstadoLogin> {
  const entrada = esquemaAdmin.safeParse({ email: formulario.get("email"), senha: formulario.get("senha") });
  if (!entrada.success) return { erro: MENSAGEM_CREDENCIAIS };
  if (!permitirRequisicao(`login:${entrada.data.email}`, 5, 15 * 60 * 1000)) {
    return { erro: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
  }

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: entrada.data.email,
    password: entrada.data.senha,
  });
  if (error || !data.user) return { erro: MENSAGEM_CREDENCIAIS };

  const { data: perfil } = await supabase.from("perfis").select("papel").eq("user_id", data.user.id).maybeSingle();
  if (perfil?.papel !== "admin") {
    await supabase.auth.signOut();
    redirect("/nao-autorizado");
  }
  await supabase.rpc("registrar_acesso");
  redirect("/login/mfa");
}

export async function sair(): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
