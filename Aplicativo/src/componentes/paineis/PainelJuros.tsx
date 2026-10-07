import EstadoVazio from "@/componentes/estados/EstadoVazio";
import GraficoSeriesDinamico from "@/componentes/graficos/GraficoSeriesDinamico";
import { CORES } from "@/componentes/graficos/tipos";
import CartaoKpi from "@/componentes/painel/CartaoKpi";
import { exibe, type Filtro } from "@/dominio/filtros";
import { formatarData, formatarMes, formatarPercentual } from "@/lib/formatacao";
import type { DadosJuros } from "@/servicos/indicadores/paineis";
import TabelaDecisoesSelic from "./TabelaDecisoesSelic";

type Props = { dados: DadosJuros; filtro: Filtro };

const CICLOS = { alta: "Ciclo de alta", queda: "Ciclo de queda", manutencao: "Manutenção" } as const;

export default function PainelJuros({ dados, filtro }: Props) {
  const { resumo, ciclo } = dados;
  if (!resumo || (!exibe(filtro, "selic") && !exibe(filtro, "cdi"))) {
    return <EstadoVazio titulo="Sem dados de juros no filtro" descricao="Marque Selic ou CDI no filtro." />;
  }
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CartaoKpi rotulo="Selic meta" valor={`${formatarPercentual(resumo.selic_atual)} a.a.`}
          detalhe={ciclo ? `${CICLOS[ciclo.direcao]} · última mudança ${formatarData(ciclo.ultima_decisao)}` : undefined} />
        <CartaoKpi rotulo="CDI no período" valor={formatarPercentual(resumo.cdi_periodo)}
          detalhe={`Anualizado hoje: ${formatarPercentual(resumo.cdi_anualizado)} a.a.`} />
        <CartaoKpi rotulo="CDI 12 meses" valor={formatarPercentual(resumo.cdi_12m)} detalhe={`Até ${formatarMes(resumo.referencia_12m)}`} />
        <CartaoKpi rotulo="Juro real 12 meses" valor={formatarPercentual(resumo.juro_real_12m)}
          detalhe={`IPCA 12m: ${formatarPercentual(resumo.ipca_12m)}`} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {exibe(filtro, "selic") && (
          <GraficoSeriesDinamico titulo="Selic meta (% a.a.)" dados={dados.selicDiaria} chaveX="data_referencia" formatoX="dia"
            series={[{ chave: "valor", rotulo: "Selic meta", cor: CORES.selic, tipo: "degrau" }]} formato="percentual" />
        )}
        <GraficoSeriesDinamico titulo="CDI × IPCA acumulados (base 100 no início do período)" dados={dados.mensal} chaveX="mes" formatoX="mes"
          series={[
            { chave: "cdi_indice", rotulo: "CDI", cor: CORES.cdi, tipo: "linha" },
            { chave: "ipca_indice", rotulo: "IPCA", cor: CORES.igpm, tipo: "linha" },
          ]} formato="indice" />
        <GraficoSeriesDinamico titulo="Juro real em 12 meses (%)" dados={dados.mensal} chaveX="mes" formatoX="mes"
          series={[{ chave: "juro_real_12m", rotulo: "Juro real 12m", cor: CORES.selic, tipo: "linha" }]} formato="percentual" />
      </div>
      <section aria-labelledby="titulo-decisoes" className="space-y-3">
        <h2 id="titulo-decisoes" className="text-lg font-semibold">Decisões do Copom no período</h2>
        <TabelaDecisoesSelic decisoes={dados.decisoes} />
      </section>
    </>
  );
}
