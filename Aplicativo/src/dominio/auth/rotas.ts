import type { Papel } from "@/tipos/auth";

export type RotaAposLogin = "/login/mfa" | "/visao-geral" | "/nao-autorizado";

// Para onde vai quem acabou de entrar por e-mail/senha ou confirmou o e-mail.
// Regra fechada: sem perfil, sem acesso ou bloqueado = não autorizado.
export function rotaAposLogin(papel: Papel | null | undefined): RotaAposLogin {
  if (papel === "admin") return "/login/mfa";
  if (papel === "usuario") return "/visao-geral";
  return "/nao-autorizado";
}

export const TIPOS_LINK_EMAIL = ["signup", "email", "recovery"] as const;
export type TipoLinkEmail = (typeof TIPOS_LINK_EMAIL)[number];

export function tipoLinkEmail(valor: string | null): TipoLinkEmail | null {
  return TIPOS_LINK_EMAIL.find((t) => t === valor) ?? null;
}

// A sessão veio do link de recuperação de senha? (claim "amr" do JWT do Supabase)
export function autenticouPorRecuperacao(amr: unknown): boolean {
  return Array.isArray(amr) && amr.some((item) => typeof item === "object" && item !== null && "method" in item && item.method === "recovery");
}
