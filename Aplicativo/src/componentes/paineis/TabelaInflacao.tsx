import type { LinhaInflacao } from "@/dominio/paineis/inflacao";
import { formatarMesCurto, formatarPercentual, formatarPontosPercentuais } from "@/lib/formatacao";

type Props = { linhas: LinhaInflacao[] };

// Tabela mês a mês (mais recente primeiro), com rolagem horizontal no celular.
export default function TabelaInflacao({ linhas }: Props) {
  const ordenadas = [...linhas].reverse();
  return (
    <div className="overflow-x-auto rounded-xl border border-borda bg-superficie">
      <table className="numero w-full min-w-[640px] text-sm">
        <caption className="sr-only">Inflação mês a mês</caption>
        <thead className="bg-superficie-2 text-left text-xs text-texto-suave">
          <tr>
            <th scope="col" className="px-3 py-2">Mês</th>
            <th scope="col" className="px-3 py-2 text-right">IPCA</th>
            <th scope="col" className="px-3 py-2 text-right">IPCA no ano</th>
            <th scope="col" className="px-3 py-2 text-right">IPCA 12m</th>
            <th scope="col" className="px-3 py-2 text-right">IGP-M</th>
            <th scope="col" className="px-3 py-2 text-right">IGP-M 12m</th>
            <th scope="col" className="px-3 py-2 text-right">INPC</th>
            <th scope="col" className="px-3 py-2 text-right">IGP-M − IPCA (12m)</th>
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((l) => (
            <tr key={l.mes} className="border-t border-borda">
              <th scope="row" className="px-3 py-2 text-left font-normal">{formatarMesCurto(l.mes)}</th>
              <td className="px-3 py-2 text-right">{formatarPercentual(l.ipca)}</td>
              <td className="px-3 py-2 text-right">{formatarPercentual(l.ipca_ano)}</td>
              <td className="px-3 py-2 text-right">{formatarPercentual(l.ipca_12m)}</td>
              <td className="px-3 py-2 text-right">{formatarPercentual(l.igpm)}</td>
              <td className="px-3 py-2 text-right">{formatarPercentual(l.igpm_12m)}</td>
              <td className="px-3 py-2 text-right">{formatarPercentual(l.inpc)}</td>
              <td className="px-3 py-2 text-right">{formatarPontosPercentuais(l.spread_igpm_ipca)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
