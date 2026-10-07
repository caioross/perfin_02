import "server-only";

// Acesso às variáveis de ambiente do servidor. A leitura é feita sob demanda para que o
// build não dependa delas; em tempo de execução, uma variável ausente falha fechado.

type NomeVariavelServidor =
  | "SUPABASE_SECRET_KEY"
  | "GOOGLE_CLIENT_ID"
  | "GOOGLE_CLIENT_SECRET"
  | "GEMINI_API_KEY"
  | "GEMINI_MODEL"
  | "TOKEN_ENCRYPTION_KEY";

export function variavelServidor(nome: NomeVariavelServidor): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(`Variável de ambiente ausente: ${nome}`);
  }
  return valor;
}

// Variáveis públicas precisam ser lidas com o nome literal para o Next.js embuti-las.
export function supabasePublico(): { url: string; chavePublica: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chavePublica = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chavePublica) {
    throw new Error("Variáveis públicas do Supabase ausentes.");
  }
  return { url, chavePublica };
}
