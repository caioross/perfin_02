import "server-only";
import { ErroReconexaoGoogle } from "@/lib/erros";

const TIMEOUT_MS = 20_000;

// 403 por escopo não concedido (consentimento granular) também pede reconexão.
async function escopoInsuficiente(resposta: Response): Promise<boolean> {
  if (resposta.status !== 403) return false;
  const texto = await resposta.clone().text().catch(() => "");
  return /insufficientPermissions|ACCESS_TOKEN_SCOPE_INSUFFICIENT|insufficient authentication scopes/i.test(texto);
}

// Requisição autenticada às APIs do Google. 401 e 403 de escopo pedem reconexão;
// outros erros viram exceção sem o corpo da resposta (pode conter dados do usuário).
export async function requisicaoGoogle(accessToken: string, url: string, init: RequestInit = {}): Promise<Response> {
  const resposta = await fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (resposta.status === 401 || (await escopoInsuficiente(resposta))) {
    throw new ErroReconexaoGoogle();
  }
  if (!resposta.ok) {
    throw new Error(`Google API respondeu ${resposta.status} em ${new URL(url).pathname}`);
  }
  return resposta;
}

export async function requisicaoGoogleJson<T>(accessToken: string, url: string, init: RequestInit = {}): Promise<T> {
  const resposta = await requisicaoGoogle(accessToken, url, init);
  return (await resposta.json()) as T;
}
