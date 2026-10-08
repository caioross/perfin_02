import { NextResponse, type NextRequest } from "next/server";
import { tipoLinkEmail } from "@/dominio/auth/rotas";
import { destinoAposLogin } from "@/lib/auth/destino";
import { registrarErro } from "@/lib/erros";
import { urlDoSite } from "@/lib/url";
import { criarClienteServidor } from "@/servicos/supabase/servidor";

// Links enviados por e-mail (confirmação de cadastro e recuperação de senha).
// Formato principal (template do Supabase): ?token_hash=…&type=email|signup|recovery — funciona
// em qualquer aparelho. Fallback: ?code=… (PKCE, só no mesmo navegador do cadastro).
export async function GET(request: NextRequest) {
  const parametros = request.nextUrl.searchParams;
  const tokenHash = parametros.get("token_hash");
  const tipo = tipoLinkEmail(parametros.get("type"));
  const codigo = parametros.get("code");
  const falha = NextResponse.redirect(urlDoSite("/login?erro=link"));

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
  if (!userId) return falha;

  if (tipo === "recovery") return NextResponse.redirect(urlDoSite("/redefinir-senha"));
  return NextResponse.redirect(urlDoSite(await destinoAposLogin(supabase, userId)));
}
