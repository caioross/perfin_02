"use client";

import dynamic from "next/dynamic";
import type { PropsGrafico } from "./tipos";

// Recharts é pesado: carrega sob demanda, só no navegador.
const GraficoSeries = dynamic(() => import("./GraficoSeries"), {
  ssr: false,
  loading: () => <div className="h-[280px] animate-pulse rounded-xl border border-borda bg-superficie" aria-hidden="true" />,
});

export default function GraficoSeriesDinamico(props: PropsGrafico) {
  return <GraficoSeries {...props} />;
}
