type Props = {
  variante?: "primario" | "secundario";
  destino?: "/login" | "/cadastro";
  rotulo?: string;
};

// Link para o login/cadastro do Portal (URL da Vercel vinda de NEXT_PUBLIC_PORTAL_URL, nunca fixa).
// O login acontece no domínio do Portal: site e Portal não compartilham sessão.
export default function BotaoPortal({ variante = "primario", destino = "/login", rotulo = "Entrar no Portal" }: Props) {
  const url = process.env.NEXT_PUBLIC_PORTAL_URL;
  if (!url || !URL.canParse(url)) return null;
  const estilo =
    variante === "primario"
      ? "bg-marca text-white hover:bg-marca-forte"
      : "border border-borda bg-superficie hover:bg-superficie-2";
  return (
    <a href={`${url.replace(/\/$/, "")}${destino}`}
      className={`inline-block whitespace-nowrap rounded-xl px-4 py-2.5 font-medium sm:px-5 sm:py-3 ${estilo}`}>
      {rotulo}
    </a>
  );
}
