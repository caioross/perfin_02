import EstadoVazio from "@/componentes/estados/EstadoVazio";
import GraficoSeriesDinamico from "@/componentes/graficos/GraficoSeriesDinamico";
import { CORES, type SerieGrafico } from "@/componentes/graficos/tipos";
import { NOMES_INDICADORES } from "@/dominio/nomesIndicadores";
import { pivotarSerieDiaria } from "@/dominio/paineis/cambio";
import type { DadosCambio } from "@/servicos/indicadores/paineis";
import CartaoMoeda from "./CartaoMoeda";

type Props = { dados: DadosCambio };

export default function PainelCambio({ dados }: Props) {
  if (dados.resumo.length === 0) {
    return <EstadoVazio titulo="Sem dados de câmbio no filtro" descricao="Marque Dólar ou Euro e escolha um período com cotações." />;
  }
  const linhas = pivotarSerieDiaria(dados.serie);
  const series: SerieGrafico[] = dados.resumo.flatMap((m) => [
    { chave: m.indicador_codigo, rotulo: NOMES_INDICADORES[m.indicador_codigo], cor: CORES[m.indicador_codigo], tipo: "linha" as const },
    { chave: `${m.indicador_codigo}_mm21`, rotulo: `${NOMES_INDICADORES[m.indicador_codigo]} — média 21 dias`, cor: CORES.media, tipo: "linha" as const, tracejada: true },
  ]);
  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {dados.resumo.map((moeda) => (
          <CartaoMoeda key={moeda.indicador_codigo} moeda={moeda} />
        ))}
      </div>
      <GraficoSeriesDinamico titulo="Cotação diária (R$) e média móvel de 21 dias úteis" dados={linhas} chaveX="data" formatoX="dia"
        series={series} formato="cotacao" altura={320} />
    </>
  );
}
