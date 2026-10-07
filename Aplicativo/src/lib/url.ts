// URL pública do Portal (sempre a da Vercel, vinda de NEXT_PUBLIC_SITE_URL; nunca localhost fixo).
export function urlDoSite(caminho = "/"): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) {
    throw new Error("Variável NEXT_PUBLIC_SITE_URL ausente.");
  }
  return new URL(caminho, base).toString();
}
