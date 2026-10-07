"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatarCotacao, formatarData, formatarMesCurto, formatarPercentual } from "@/lib/formatacao";
import { CORES, type FormatoGrafico, type LinhaGrafico, type PropsGrafico, type SerieGrafico } from "./tipos";

const FORMATADORES: Record<FormatoGrafico, (v: number) => string> = {
  percentual: (v) => formatarPercentual(v),
  cotacao: (v) => formatarCotacao(v),
  indice: (v) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
};

function desenharSerie(serie: SerieGrafico) {
  const comum = { key: serie.chave, dataKey: serie.chave, name: serie.rotulo, isAnimationActive: false };
  if (serie.tipo === "barra") return <Bar {...comum} fill={serie.cor} />;
  return (
    <Line {...comum} type={serie.tipo === "degrau" ? "stepAfter" : "monotone"} stroke={serie.cor} strokeWidth={2}
      strokeDasharray={serie.tracejada ? "5 4" : undefined} dot={false} connectNulls />
  );
}

// Gráfico de séries temporais (linhas, barras ou degraus) com faixa opcional.
export default function GraficoSeries({ titulo, dados, chaveX, formatoX, series, formato, faixa, altura = 280 }: PropsGrafico) {
  const formatarValor = FORMATADORES[formato];
  const formatarX = (v: string) => (formatoX === "mes" ? formatarMesCurto(v) : formatarData(v));
  return (
    <figure className="rounded-xl border border-borda bg-superficie p-3">
      <figcaption className="mb-2 text-sm font-medium">{titulo}</figcaption>
      <div style={{ height: altura }} role="img" aria-label={titulo}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dados} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="currentColor" strokeOpacity={0.1} vertical={false} />
            <XAxis dataKey={chaveX} tickFormatter={formatarX} tick={{ fontSize: 11, fill: "currentColor" }} minTickGap={24} />
            <YAxis tickFormatter={formatarValor} tick={{ fontSize: 11, fill: "currentColor" }} width={72} domain={["auto", "auto"]} />
            <Tooltip
              formatter={(valor) => (typeof valor === "number" ? formatarValor(valor) : String(valor ?? "—"))}
              labelFormatter={(rotulo) => formatarX(String(rotulo))}
              contentStyle={{ background: "var(--superficie)", border: "1px solid var(--borda)", borderRadius: 8, fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {faixa && (
              <Area dataKey={(linha: LinhaGrafico) => [linha[faixa.chaveInferior], linha[faixa.chaveSuperior]]}
                name={faixa.rotulo} type="stepAfter" fill={CORES.faixa} fillOpacity={0.12} stroke="none" isAnimationActive={false} />
            )}
            {series.map(desenharSerie)}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
