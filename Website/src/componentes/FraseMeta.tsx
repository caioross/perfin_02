import { formatarPercentual } from "@/lib/formatacao";
import type { MetaTermometro } from "@/tipos/termometro";

const TEXTOS: Record<string, string> = {
  acima_do_teto: "acima do teto da meta",
  abaixo_do_piso: "abaixo do piso da meta",
  dentro_da_meta: "dentro da meta",
};

// Uma frase sobre a inflação frente à meta (regra C6).
export default function FraseMeta({ meta }: { meta: MetaTermometro | null }) {
  if (!meta || meta.ipca_12m == null || !TEXTOS[meta.status]) return null;
  const destaque = meta.status === "dentro_da_meta" ? "text-marca" : "text-alerta";
  return (
    <p className="text-lg">
      A inflação (IPCA) acumulada em 12 meses está em <strong>{formatarPercentual(meta.ipca_12m)}</strong>,{" "}
      <strong className={destaque}>{TEXTOS[meta.status]}</strong> de {formatarPercentual(meta.centro)} (tolerância de{" "}
      {formatarPercentual(meta.piso)} a {formatarPercentual(meta.teto)}).
    </p>
  );
}
