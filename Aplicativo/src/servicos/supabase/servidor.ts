import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublico } from "@/lib/env";

// Cliente Supabase com a sessão do usuário (cookies): todas as consultas passam pelo RLS.
export async function criarClienteServidor() {
  const armazenamento = await cookies();
  const { url, chavePublica } = supabasePublico();
  return createServerClient(url, chavePublica, {
    cookies: {
      getAll: () => armazenamento.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => armazenamento.set(name, value, options));
        } catch {
          // Em Server Components os cookies são somente leitura; o proxy renova a sessão.
        }
      },
    },
  });
}

export type ClienteSupabase = Awaited<ReturnType<typeof criarClienteServidor>>;
