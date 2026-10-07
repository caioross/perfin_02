type Props = { variante?: "primario" | "secundario" };

// Link para o Portal (URL da Vercel vinda de NEXT_PUBLIC_PORTAL_URL, nunca fixa no código).
export default function BotaoPortal({ variante = "primario" }: Props) {
  const url = process.env.NEXT_PUBLIC_PORTAL_URL;
  if (!url) return null;
  const estilo =
    variante === "primario"
      ? "bg-marca text-white hover:bg-marca-forte"
      : "border border-borda bg-superficie hover:bg-superficie-2";
  return (
    <a href={new URL("/login", url).toString()} className={`inline-block rounded-xl px-5 py-3 font-medium ${estilo}`}>
      Entrar no Portal
    </a>
  );
}
