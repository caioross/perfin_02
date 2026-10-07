import EstadoVazio from "@/componentes/estados/EstadoVazio";
import GraficoSeriesDinamico from "@/componentes/graficos/GraficoSeriesDinamico";
import { CORES, type SerieGrafico } from "@/componentes/graficos/tipos";
import CartaoKpi from "@/componentes/painel/CartaoKpi";
import { exibe, type Filtro } from "@/dominio/filtros";
import { NOMES_INDICADORES } from "@/dominio/nomesIndicadores";
import { pivotarInflacao } from "@/dominio/paineis/inflacao";
import { formatarMes, formatarPercentual } from "@/lib/formatacao";
import type { DadosInflacao } from "@/servicos/indicadores/paineis";
import type { CodigoInflacao } from "@/tipos/indicadores";
import TabelaInflacao from "./TabelaInflacao";

type Props = { dados: DadosInflacao; filtro: Filtro };

const INDICES: CodigoInflacao[] = ["ipca", "igpm", "inpc"];

export default function PainelInflacao({ dados, filtro }: Props) {
  const indices = INDICES.filter((c) => exibe(filtro, c));
  if (dados.serie.length === 0 || indices.length === 0) {
    return <EstadoVazio titulo="Sem dados de inflação no período" descricao="Escolha outro período ou marque IPCA, IGP-M ou INPC." />;
  }
  const linhas = pivotarInflacao(dados.serie, dados.metas);
  const barras: SerieGrafico[] = indices.map((c) => ({ chave: c, rotulo: NOMES_INDICADORES[c], cor: CORES[c], tipo: "barra" }));
  const doze: SerieGrafico[] = indices.map((c) => ({ chave: `${c}_12m`, rotulo: `${NOMES_INDICADORES[c]} 12m`, cor: CORES[c], tipo: "linha" }));

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {dados.resumo.filter((r) => indices.includes(r.indicador_codigo)).map((r) => (
          <CartaoKpi key={r.indicador_codigo} rotulo={`${NOMES_INDICADORES[r.indicador_codigo]} no período`}
            valor={formatarPercentual(r.acumulado_periodo)}
            detalhe={`Até ${formatarMes(r.periodo_ate)} · 12m ${formatarPercentual(r.acumulado_12m)} · ano ${formatarPercentual(r.acumulado_ano)}`} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GraficoSeriesDinamico titulo="Variação mensal (%)" dados={linhas} chaveX="mes" formatoX="mes" series={barras} formato="percentual" />
        <GraficoSeriesDinamico titulo="Acumulado em 12 meses (%) e faixa da meta" dados={linhas} chaveX="mes" formatoX="mes"
          series={doze} formato="percentual"
          faixa={exibe(filtro, "ipca") ? { chaveInferior: "piso", chaveSuperior: "teto", rotulo: "Faixa da meta (IPCA)" } : undefined} />
      </div>
      <TabelaInflacao linhas={linhas} />
    </>
  );
}
