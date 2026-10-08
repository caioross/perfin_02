import "server-only";
import { autenticouPorRecuperacao } from "@/dominio/auth/rotas";
import { criarClienteServidor, type ClienteSupabase } from "@/servicos/supabase/servidor";
import type { Papel } from "@/tipos/auth";

// Sessão aberta pelo link de "esqueci minha senha" de um usuário com acesso; caso contrário, null.
export async function obterSessaoDeRecuperacao(): Promise<{ supabase: ClienteSupabase; userId: string } | null> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub || !autenticouPorRecuperacao(claims.amr)) return null;

  const { data: perfil } = await supabase
    .from("perfis")
    .select("papel")
    .eq("user_id", claims.sub)
    .maybeSingle<{ papel: Papel }>();
  if (perfil?.papel !== "usuario" && perfil?.papel !== "admin") return null;
  return { supabase, userId: claims.sub };
}
