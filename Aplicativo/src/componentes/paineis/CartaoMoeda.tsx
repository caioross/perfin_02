import { NOMES_INDICADORES } from "@/dominio/nomesIndicadores";
import { formatarCotacao, formatarData, formatarPercentual } from "@/lib/formatacao";
import type { ResumoCambio } from "@/tipos/indicadores";
import Variacao from "./ItemVariacao";

type Props = { moeda: ResumoCambio };

export default function CartaoMoeda({ moeda }: Props) {
  return (
    <article className="space-y-3 rounded-xl border border-borda bg-superficie p-4">
      <header className="flex items-baseline justify-between">
        <h3 className="font-semibold">{NOMES_INDICADORES[moeda.indicador_codigo]} (PTAX venda)</h3>
        <span className="text-xs text-texto-suave">{formatarData(moeda.ultima_data)}</span>
      </header>
      <p className="numero text-3xl font-semibold">{formatarCotacao(moeda.ultimo_valor)}</p>
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <Variacao rotulo="No período" valor={moeda.variacao_periodo} />
        <Variacao rotulo="No mês" valor={moeda.variacao_mes} />
        <Variacao rotulo="No ano" valor={moeda.variacao_ano} />
        <Variacao rotulo="12 meses" valor={moeda.variacao_12m} />
        <div>
          <dt className="text-xs text-texto-suave">Mín. / máx. período</dt>
          <dd className="numero font-medium">{formatarCotacao(moeda.minimo)} / {formatarCotacao(moeda.maximo)}</dd>
        </div>
        <div>
          <dt className="text-xs text-texto-suave">Volatilidade (a.a.)</dt>
          <dd className="numero font-medium">{formatarPercentual(moeda.volatilidade_anual)}</dd>
        </div>
      </dl>
    </article>
  );
}
