import EstadoVazio from "@/componentes/estados/EstadoVazio";
import { formatarDataHora, formatarMes } from "@/lib/formatacao";
import type { Relatorio } from "@/tipos/google";
import BotaoRascunho from "./BotaoRascunho";

type Props = { relatorios: Relatorio[] };

export default function ListaRelatorios({ relatorios }: Props) {
  if (relatorios.length === 0) {
    return <EstadoVazio titulo="Nenhum relatório gerado ainda" descricao="Escolha o mês e gere a primeira planilha." />;
  }
  return (
    <ul className="space-y-3">
      {relatorios.map((r) => (
        <li key={r.id} className="space-y-3 rounded-xl border border-borda bg-superficie p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-semibold">{formatarMes(r.mes_referencia)}</h3>
            <span className="text-xs text-texto-suave">Gerado em {formatarDataHora(r.criado_em)}</span>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <a href={r.drive_url} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-marca px-3 py-1.5 font-medium text-white hover:bg-marca-forte">
              Abrir no Google Drive
            </a>
            <a href={`/api/relatorios/${r.id}/xlsx`} className="rounded-lg border border-borda px-3 py-1.5 hover:bg-superficie-2">
              Baixar Excel (.xlsx)
            </a>
          </div>
          <BotaoRascunho relatorioId={r.id} jaCriado={r.rascunho_gmail_id !== null} />
        </li>
      ))}
    </ul>
  );
}
