import { formatarPercentual } from "@/lib/formatacao";
import type { MetaCadastrada } from "@/servicos/admin";

type Props = { metas: MetaCadastrada[] };

export default function ListaMetas({ metas }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-borda bg-superficie">
      <table className="numero w-full text-sm">
        <caption className="sr-only">Metas de inflação cadastradas</caption>
        <thead className="bg-superficie-2 text-left text-xs text-texto-suave">
          <tr>
            <th scope="col" className="px-3 py-2">Ano</th>
            <th scope="col" className="px-3 py-2 text-right">Centro</th>
            <th scope="col" className="px-3 py-2 text-right">Tolerância</th>
          </tr>
        </thead>
        <tbody>
          {metas.map((m) => (
            <tr key={m.ano} className="border-t border-borda">
              <th scope="row" className="px-3 py-2 text-left font-normal">{m.ano}</th>
              <td className="px-3 py-2 text-right">{formatarPercentual(m.centro)}</td>
              <td className="px-3 py-2 text-right">± {m.tolerancia.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} p.p.</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
