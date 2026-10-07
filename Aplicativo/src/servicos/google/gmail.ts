import "server-only";
import { requisicaoGoogleJson } from "./cliente";

// Gmail: este módulo expõe SOMENTE a criação de rascunho. O Portal nunca envia e-mails;
// o usuário revisa e envia pelo próprio Gmail. (Há teste garantindo que nada mais é exportado.)
const URL_RASCUNHOS = "https://gmail.googleapis.com/gmail/v1/users/me/drafts";

export async function criarRascunho(accessToken: string, mensagemMimeBase64Url: string): Promise<string> {
  const criado = await requisicaoGoogleJson<{ id: string }>(accessToken, URL_RASCUNHOS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: { raw: mensagemMimeBase64Url } }),
  });
  return criado.id;
}
