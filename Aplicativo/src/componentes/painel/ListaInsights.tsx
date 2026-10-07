import EstadoVazio from "@/componentes/estados/EstadoVazio";
import type { Insight, Severidade } from "@/tipos/insights";

const ESTILOS: Record<Severidade, { rotulo: string; classe: string }> = {
  alerta: { rotulo: "Alerta", classe: "border-l-alerta bg-alerta-suave/60" },
  atencao: { rotulo: "Atenção", classe: "border-l-atencao bg-atencao-suave/60" },
  informativo: { rotulo: "Informativo", classe: "border-l-info bg-info-suave/60" },
};

type Props = { insights: Insight[]; limite?: number };

export default function ListaInsights({ insights, limite }: Props) {
  const exibidos = limite ? insights.slice(0, limite) : insights;
  if (exibidos.length === 0) {
    return <EstadoVazio titulo="Nenhum destaque no período" descricao="Os indicadores filtrados não acionaram nenhuma regra." />;
  }
  return (
    <ul className="space-y-2">
      {exibidos.map((insight) => (
        <li key={insight.id} className={`rounded-lg border border-borda border-l-4 p-3 ${ESTILOS[insight.severidade].classe}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
            {ESTILOS[insight.severidade].rotulo} · {insight.titulo}
          </p>
          <p className="mt-1 text-sm">{insight.texto}</p>
        </li>
      ))}
    </ul>
  );
}
