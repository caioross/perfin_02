import { cacheLife } from "next/cache";
import type { Termometro } from "@/tipos/termometro";

// Busca o termômetro público (função termometro_publico, liberada para anon).
// Sucesso fica em cache por horas; falha, só por minutos — uma oscilação do Supabase não
// deixa o site "indisponível" por 1 hora.
async function buscarTermometroEmCache(url: string, chave: string): Promise<Termometro | null> {
  "use cache";
  try {
    const resposta = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/termometro_publico`, {
      method: "POST",
      headers: { apikey: chave, "Content-Type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(10_000),
    });
    const dados = resposta.ok ? ((await resposta.json()) as Termometro) : null;
    if (dados && Array.isArray(dados.indicadores)) {
      cacheLife("hours");
      return dados;
    }
  } catch {
    // Tratado abaixo: resultado vazio com cache curto.
  }
  cacheLife("minutes");
  return null;
}

// Sem as variáveis públicas, o site mostra "indisponível" (nunca quebra o build nem a página).
export async function buscarTermometro(): Promise<Termometro | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chave) return null;
  return buscarTermometroEmCache(url, chave);
}
