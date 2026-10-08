import "server-only";
import { rotaAposLogin, type RotaAposLogin } from "@/dominio/auth/rotas";
import type { ClienteSupabase } from "@/servicos/supabase/servidor";
import type { Papel } from "@/tipos/auth";

// Depois de autenticar por e-mail/senha (ou confirmar o e-mail): decide a rota pelo papel.
// Quem não tem acesso sai na hora (falha fechada); os demais têm o último acesso registrado.
export async function destinoAposLogin(supabase: ClienteSupabase, userId: string): Promise<RotaAposLogin> {
  const { data: perfil } = await supabase
    .from("perfis")
    .select("papel")
    .eq("user_id", userId)
    .maybeSingle<{ papel: Papel }>();
  const rota = rotaAposLogin(perfil?.papel);
  if (rota === "/nao-autorizado") {
    await supabase.auth.signOut();
  } else {
    await supabase.rpc("registrar_acesso");
  }
  return rota;
}
