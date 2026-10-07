import type { ReactNode } from "react";
import MiniTendencia from "./MiniTendencia";

type Props = {
  rotulo: string;
  valor: string;
  detalhe?: string;
  selo?: ReactNode;
  tendencia?: number[];
};

export default function CartaoKpi({ rotulo, valor, detalhe, selo, tendencia }: Props) {
  return (
    <article className="flex flex-col justify-between gap-2 rounded-xl border border-borda bg-superficie p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm text-texto-suave">{rotulo}</h3>
        {selo}
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="numero text-2xl font-semibold">{valor}</p>
        {tendencia && <MiniTendencia valores={tendencia} rotulo={`Tendência de ${rotulo}`} />}
      </div>
      {detalhe && <p className="text-xs text-texto-suave">{detalhe}</p>}
    </article>
  );
}
