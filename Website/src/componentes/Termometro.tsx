import { buscarTermometro } from "@/lib/termometro";
import { formatarDataHora } from "@/lib/formatacao";
import CartaoIndicador from "./CartaoIndicador";
import FraseMeta from "./FraseMeta";

// Termômetro econômico público: só os últimos valores (fonte: Banco Central).
export default async function Termometro() {
  const termometro = await buscarTermometro();
  if (!termometro || termometro.indicadores.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-borda p-6 text-center text-texto-suave">
        O termômetro está temporariamente indisponível. Tente novamente em instantes.
      </p>
    );
  }
  return (
    <div className="space-y-6">
      <FraseMeta meta={termometro.meta} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {termometro.indicadores.map((item) => (
          <CartaoIndicador key={item.codigo} item={item} />
        ))}
      </div>
      <p className="text-xs text-texto-suave">
        Fonte: Banco Central do Brasil (SGS). Atualizado em {formatarDataHora(termometro.atualizado_em)}.
      </p>
    </div>
  );
}
