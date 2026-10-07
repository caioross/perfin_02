import { alternarIndicadorAcao } from "@/app/(portal)/admin/acoes";
import { formatarData, formatarDataHora } from "@/lib/formatacao";
import type { SaudeColeta } from "@/servicos/admin";
import SituacaoColeta from "./SituacaoColeta";

type Props = { saude: SaudeColeta[] };

// Catálogo + saúde da coleta: status por indicador e ativação (indicador inativo some do Portal e do site).
export default function TabelaSaudeColeta({ saude }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-borda bg-superficie">
      <table className="w-full min-w-[720px] text-sm">
        <caption className="sr-only">Saúde da coleta por indicador</caption>
        <thead className="bg-superficie-2 text-left text-xs text-texto-suave">
          <tr>
            <th scope="col" className="px-3 py-2">Indicador</th>
            <th scope="col" className="px-3 py-2">Último dado</th>
            <th scope="col" className="px-3 py-2">Última coleta</th>
            <th scope="col" className="px-3 py-2">Situação</th>
            <th scope="col" className="px-3 py-2">Catálogo</th>
          </tr>
        </thead>
        <tbody>
          {saude.map((item) => (
            <tr key={item.indicador_codigo} className="border-t border-borda align-top">
              <th scope="row" className="px-3 py-2 text-left font-medium">{item.nome}</th>
              <td className="numero px-3 py-2">{formatarData(item.ultima_data)}</td>
              <td className="numero px-3 py-2">
                {formatarDataHora(item.ultima_coleta)}
                {item.ultimos_registros != null && <span className="block text-xs text-texto-suave">{item.ultimos_registros} registro(s)</span>}
              </td>
              <td className="px-3 py-2">
                <SituacaoColeta item={item} />
                {item.ultimo_erro && <span className="block max-w-xs truncate text-xs text-texto-suave" title={item.ultimo_erro}>{item.ultimo_erro}</span>}
              </td>
              <td className="px-3 py-2">
                <form action={alternarIndicadorAcao}>
                  <input type="hidden" name="codigo" value={item.indicador_codigo} />
                  <input type="hidden" name="ativo" value={item.ativo ? "nao" : "sim"} />
                  <button type="submit" className="rounded-lg border border-borda px-3 py-1 hover:bg-superficie-2">
                    {item.ativo ? "Desativar" : "Ativar"}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
