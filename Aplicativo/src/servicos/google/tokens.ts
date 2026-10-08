import "server-only";
import { cifrar, decifrar } from "@/lib/cripto";
import { variavelServidor } from "@/lib/env";
import { ErroReconexaoGoogle } from "@/lib/erros";
import { criarClienteAdmin } from "@/servicos/supabase/admin";

const URL_TOKEN = "https://oauth2.googleapis.com/token";

// Guarda o refresh token do Google cifrado (AES-256-GCM). Chamado só no callback do login.
export async function salvarRefreshToken(userId: string, refreshToken: string, escopos: string[]): Promise<void> {
  const cifrado = cifrar(refreshToken, variavelServidor("TOKEN_ENCRYPTION_KEY"));
  const { error } = await criarClienteAdmin()
    .from("google_tokens")
    .upsert({ user_id: userId, refresh_token_cifrado: cifrado, escopos, atualizado_em: new Date().toISOString() });
  if (error) throw new Error(`Falha ao salvar token Google: ${error.code ?? ""}`);
}

async function lerRefreshToken(userId: string): Promise<string | null> {
  const { data, error } = await criarClienteAdmin()
    .from("google_tokens")
    .select("refresh_token_cifrado")
    .eq("user_id", userId)
    .maybeSingle<{ refresh_token_cifrado: string }>();
  if (error) throw new Error(`Falha ao ler token Google: ${error.code ?? ""}`);
  return data ? decifrar(data.refresh_token_cifrado, variavelServidor("TOKEN_ENCRYPTION_KEY")) : null;
}

export async function removerRefreshToken(userId: string): Promise<void> {
  await criarClienteAdmin().from("google_tokens").delete().eq("user_id", userId);
}

// Troca o refresh token por um access token novo (válido por ~1h). Se o Google recusar
// (invalid_grant: expirou após 7 dias no modo Teste ou acesso revogado), pede reconexão.
export async function obterAccessToken(userId: string): Promise<string> {
  const refreshToken = await lerRefreshToken(userId);
  if (!refreshToken) throw new ErroReconexaoGoogle();

  const resposta = await fetch(URL_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: variavelServidor("GOOGLE_CLIENT_ID"),
      client_secret: variavelServidor("GOOGLE_CLIENT_SECRET"),
    }),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  const corpo = (await resposta.json().catch(() => ({}))) as { access_token?: string; error?: string };
  if (corpo.error === "invalid_grant") {
    // Só aqui o token é inválido de fato. Outros erros (ex.: invalid_client por secret trocado)
    // são de configuração e não podem apagar o token de todos os usuários.
    await removerRefreshToken(userId);
    throw new ErroReconexaoGoogle();
  }
  if (!resposta.ok) throw new Error(`Google OAuth respondeu ${resposta.status} (${corpo.error ?? "sem código"})`);
  if (!corpo.access_token) throw new Error("Google OAuth não retornou access_token.");
  return corpo.access_token;
}
