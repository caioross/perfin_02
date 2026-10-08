import type { Papel } from "@/tipos/auth";

// Espelha a política RLS perfis_admin_bloqueia_usuario (o banco decide; a tela só não oferece
// a ação onde ela seria recusada).
export function podeAlternarBloqueio(perfil: { provedor: string; papel: Papel }): boolean {
  return (perfil.provedor === "google" || perfil.provedor === "email") &&
    (perfil.papel === "usuario" || perfil.papel === "bloqueado");
}

const ROTULOS_PROVEDOR: Record<string, string> = { google: "Google", email: "E-mail e senha" };

export function rotuloProvedor(provedor: string): string {
  return Object.hasOwn(ROTULOS_PROVEDOR, provedor) ? ROTULOS_PROVEDOR[provedor] : "Outro";
}
