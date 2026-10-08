import { NextResponse, type NextRequest } from "next/server";
import { usaRecursosGoogle } from "@/dominio/auth/recursos";
import { ESCOPOS_GOOGLE } from "@/lib/auth/escoposGoogle";
import { registrarErro } from "@/lib/erros";
import { urlDoSite } from "@/lib/url";
import { salvarRefreshToken } from "@/servicos/google/tokens";
import { criarClienteServidor } from "@/servicos/supabase/servidor";

// Retorno do login Google (via Supabase). Valida o papel ANTES de guardar qualquer token:
// quem não é "usuario" (bloqueado, sem acesso, admin) sai e vê "acesso não autorizado".
export async function GET(request: NextRequest) {
  const codigo = request.nextUrl.searchParams.get("code");
  if (!codigo) return NextResponse.redirect(urlDoSite("/login?erro=google"));

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.exchangeCodeForSession(codigo);
  if (error || !data.session) {
    registrarErro("callback google", error);
    return NextResponse.redirect(urlDoSite("/login?erro=google"));
  }

  const usuarioId = data.session.user.id;
  const { data: perfil } = await supabase
    .from("perfis")
    .select("papel, provedor")
    .eq("user_id", usuarioId)
    .maybeSingle<{ papel: string; provedor: string }>();
  if (perfil?.papel !== "usuario") {
    await supabase.auth.signOut();
    return NextResponse.redirect(urlDoSite("/nao-autorizado"));
  }

  const refreshToken = data.session.provider_refresh_token;
  // Conta de e-mail com Google vinculado depois não recebe token (ver dominio/auth/recursos.ts).
  if (refreshToken && usaRecursosGoogle(perfil.provedor)) {
    try {
      await salvarRefreshToken(usuarioId, refreshToken, [...ESCOPOS_GOOGLE]);
    } catch (erro) {
      registrarErro("salvar token google", erro);
    }
  }
  await supabase.rpc("registrar_acesso");
  return NextResponse.redirect(urlDoSite("/visao-geral"));
}
