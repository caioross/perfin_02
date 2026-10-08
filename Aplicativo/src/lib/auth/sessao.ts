import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { criarClienteServidor } from "@/servicos/supabase/servidor";
import type { Papel, PapelComAcesso, UsuarioAtual } from "@/tipos/auth";

export type EstadoSessao =
  | { estado: "anonimo" }
  | { estado: "negado" }
  | { estado: "mfa_pendente" }
  | { estado: "ok"; usuario: UsuarioAtual };

function papelComAcesso(papel: Papel | undefined): papel is PapelComAcesso {
  return papel === "admin" || papel === "usuario";
}

// Lê e valida a sessão no servidor (getUser consulta o Supabase Auth; nunca confia só no cookie).
// Regra fechada: sem perfil, papel sem acesso, e-mail não confirmado ou admin sem MFA = sem acesso.
export const obterEstadoSessao = cache(async (): Promise<EstadoSessao> => {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { estado: "anonimo" };
  if (!data.user.email_confirmed_at) return { estado: "negado" };

  const { data: perfil } = await supabase
    .from("perfis")
    .select("email, nome, papel, provedor")
    .eq("user_id", data.user.id)
    .maybeSingle<{ email: string; nome: string | null; papel: Papel; provedor: string }>();
  if (!perfil || !papelComAcesso(perfil.papel)) return { estado: "negado" };

  if (perfil.papel === "admin") {
    const { data: nivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (nivel?.currentLevel !== "aal2") return { estado: "mfa_pendente" };
  }
  return {
    estado: "ok",
    usuario: { id: data.user.id, email: perfil.email, nome: perfil.nome, papel: perfil.papel, provedor: perfil.provedor },
  };
});

// Para páginas: redireciona quem não pode ver a página.
export async function exigirAcesso(papeis: PapelComAcesso[] = ["admin", "usuario"]): Promise<UsuarioAtual> {
  const sessao = await obterEstadoSessao();
  if (sessao.estado === "anonimo") redirect("/login");
  if (sessao.estado === "negado") redirect("/nao-autorizado");
  if (sessao.estado === "mfa_pendente") redirect("/login/mfa");
  if (!papeis.includes(sessao.usuario.papel)) redirect("/visao-geral");
  return sessao.usuario;
}

// Etapa de MFA do admin: exige login e papel admin, mas ainda aceita sessão aal1.
export async function exigirAdminAntesDoMfa() {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const { data: perfil } = await supabase.from("perfis").select("papel").eq("user_id", data.user.id).maybeSingle();
  if (perfil?.papel !== "admin") redirect("/nao-autorizado");
  return { supabase, userId: data.user.id };
}

// Para Server Actions e Route Handlers: retorna null em vez de redirecionar (falha fechada).
export async function verificarAcesso(papeis: PapelComAcesso[] = ["admin", "usuario"]): Promise<UsuarioAtual | null> {
  const sessao = await obterEstadoSessao();
  if (sessao.estado !== "ok" || !papeis.includes(sessao.usuario.papel)) return null;
  return sessao.usuario;
}
