import EstadoVazio from "@/componentes/estados/EstadoVazio";
import { formatarData, formatarPercentual, formatarPontosPercentuais } from "@/lib/formatacao";
import type { DecisaoSelic } from "@/tipos/indicadores";

type Props = { decisoes: DecisaoSelic[] };

export default function TabelaDecisoesSelic({ decisoes }: Props) {
  if (decisoes.length === 0) {
    return <EstadoVazio titulo="Sem mudanças da Selic no período" />;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-borda bg-superficie">
      <table className="numero w-full text-sm">
        <caption className="sr-only">Decisões da Selic no período</caption>
        <thead className="bg-superficie-2 text-left text-xs text-texto-suave">
          <tr>
            <th scope="col" className="px-3 py-2">Vigência</th>
            <th scope="col" className="px-3 py-2 text-right">De</th>
            <th scope="col" className="px-3 py-2 text-right">Para</th>
            <th scope="col" className="px-3 py-2 text-right">Variação</th>
          </tr>
        </thead>
        <tbody>
          {[...decisoes].reverse().map((d) => (
            <tr key={d.data_referencia} className="border-t border-borda">
              <th scope="row" className="px-3 py-2 text-left font-normal">{formatarData(d.data_referencia)}</th>
              <td className="px-3 py-2 text-right">{formatarPercentual(d.anterior)}</td>
              <td className="px-3 py-2 text-right">{formatarPercentual(d.novo)}</td>
              <td className={`px-3 py-2 text-right ${d.variacao_pp > 0 ? "text-alerta" : "text-positivo"}`}>
                {formatarPontosPercentuais(d.variacao_pp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
