import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Proxy (antigo middleware): renova os cookies da sessão do Supabase e faz a checagem
// otimista de login. A autorização real (papel, MFA) é feita no servidor de cada página/ação.

const ROTAS_PUBLICAS = ["/login", "/cadastro", "/esqueci-senha", "/auth", "/nao-autorizado", "/offline"];

function rotaPublica(caminho: string): boolean {
  return ROTAS_PUBLICAS.some((rota) => caminho === rota || caminho.startsWith(`${rota}/`));
}

// Sem sessão: APIs respondem 401; páginas vão para o login (falha fechada).
function negarAcesso(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chave) {
    return rotaPublica(request.nextUrl.pathname) ? resposta : negarAcesso(request);
  }

  const supabase = createServerClient(url, chave, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        resposta = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const logado = Boolean(data?.claims?.sub);
  if (!logado && !rotaPublica(request.nextUrl.pathname)) return negarAcesso(request);
  return resposta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.png|sw.js|manifest.webmanifest|icones/).*)"],
};
