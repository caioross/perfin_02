import { formatarReferencia, formatarValor } from "@/lib/formatacao";
import type { ItemTermometro } from "@/tipos/termometro";

export default function CartaoIndicador({ item }: { item: ItemTermometro }) {
  return (
    <article className="rounded-2xl border border-borda bg-superficie p-5">
      <h3 className="text-sm font-semibold">{item.nome}</h3>
      <p className="text-xs text-texto-suave">{item.rotulo}</p>
      <p className="mt-3 text-3xl font-semibold tabular-nums">{formatarValor(item.codigo, item.valor)}</p>
      <p className="mt-1 text-xs text-texto-suave">{formatarReferencia(item.codigo, item.data_referencia)}</p>
    </article>
  );
}
