import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM para guardar o refresh token do Google. Formato: v1.<iv>.<tag>.<cifrado> (base64url).
const VERSAO = "v1";

function chave(chaveBase64: string): Buffer {
  const bytes = Buffer.from(chaveBase64, "base64");
  if (bytes.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY deve ter 32 bytes em base64.");
  }
  return bytes;
}

export function cifrar(texto: string, chaveBase64: string): string {
  const iv = randomBytes(12);
  const cifra = createCipheriv("aes-256-gcm", chave(chaveBase64), iv);
  const cifrado = Buffer.concat([cifra.update(texto, "utf8"), cifra.final()]);
  const tag = cifra.getAuthTag();
  return [VERSAO, iv.toString("base64url"), tag.toString("base64url"), cifrado.toString("base64url")].join(".");
}

export function decifrar(valor: string, chaveBase64: string): string {
  const [versao, iv, tag, cifrado] = valor.split(".");
  if (versao !== VERSAO || !iv || !tag || !cifrado) {
    throw new Error("Formato de token cifrado inválido.");
  }
  const decifra = createDecipheriv("aes-256-gcm", chave(chaveBase64), Buffer.from(iv, "base64url"));
  decifra.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decifra.update(Buffer.from(cifrado, "base64url")), decifra.final()]).toString("utf8");
}
