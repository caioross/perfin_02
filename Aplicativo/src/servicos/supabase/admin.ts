import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabasePublico, variavelServidor } from "@/lib/env";

// Cliente com a secret key (ignora RLS). Uso restrito à tabela google_tokens, que não tem
// políticas para clientes. Nunca usar para dados de indicadores ou perfis.
export function criarClienteAdmin() {
  const { url } = supabasePublico();
  return createClient(url, variavelServidor("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
