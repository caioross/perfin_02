import type { ResumoPainel } from "@/dominio/insights/tipos";
import type { Filtro } from "@/dominio/filtros";
import { exibe } from "@/dominio/filtros";
import { formatarCotacao, formatarData, formatarMes, formatarPercentual } from "@/lib/formatacao";
import type { CodigoIndicador } from "@/tipos/indicadores";
import CartaoKpi from "./CartaoKpi";
import SeloMeta from "./SeloMeta";

type Props = { resumo: ResumoPainel; filtro: Filtro };

type Cartao = { chave: string; indicador: CodigoIndicador; elemento: React.ReactNode };

function cartoesInflacao(resumo: ResumoPainel): Cartao[] {
  const ipca = resumo.inflacao.find((i) => i.indicador_codigo === "ipca");
  const tendenciaIpca = resumo.serieIpca.map((p) => p.acumulado_12m).filter((v): v is number => v != null);
  const doze = (codigo: "igpm" | "inpc", nome: string): Cartao => {
    const item = resumo.inflacao.find((i) => i.indicador_codigo === codigo);
    return { chave: codigo, indicador: codigo, elemento: (
      <CartaoKpi rotulo={`${nome} 12 meses`} valor={formatarPercentual(item?.acumulado_12m)} detalhe={`Até ${formatarMes(item?.ultima_data)}`} />
    ) };
  };
  return [
    { chave: "ipca12", indicador: "ipca", elemento: (
      <CartaoKpi rotulo="IPCA 12 meses" valor={formatarPercentual(resumo.meta?.ipca_12m)}
        selo={resumo.meta ? <SeloMeta status={resumo.meta.status} /> : undefined}
        detalhe={resumo.meta?.centro != null ? `Meta ${formatarPercentual(resumo.meta.centro)} (${formatarPercentual(resumo.meta.piso)} a ${formatarPercentual(resumo.meta.teto)})` : undefined}
        tendencia={tendenciaIpca} />
    ) },
    { chave: "ipcames", indicador: "ipca", elemento: (
      <CartaoKpi rotulo="IPCA do mês" valor={formatarPercentual(ipca?.valor_mes)} detalhe={formatarMes(ipca?.ultima_data)} />
    ) },
    doze("igpm", "IGP-M"),
    doze("inpc", "INPC"),
  ];
}

function cartoesJurosCambio(resumo: ResumoPainel): Cartao[] {
  const j = resumo.juros;
  const moeda = (codigo: "dolar" | "euro", nome: string): Cartao => {
    const m = resumo.cambioPeriodo.find((c) => c.indicador_codigo === codigo);
    return { chave: codigo, indicador: codigo, elemento: (
      <CartaoKpi rotulo={nome} valor={formatarCotacao(m?.ultimo_valor)}
        detalhe={m ? `${formatarPercentual(m.variacao_mes)} no mês · ${formatarData(m.ultima_data)}` : undefined} />
    ) };
  };
  return [
    { chave: "selic", indicador: "selic", elemento: (
      <CartaoKpi rotulo="Selic meta" valor={`${formatarPercentual(j?.selic_atual)} a.a.`} detalhe={`Desde ${formatarData(resumo.ciclo?.ultima_decisao)}`} />
    ) },
    { chave: "cdi", indicador: "cdi", elemento: (
      <CartaoKpi rotulo="CDI 12 meses" valor={formatarPercentual(j?.cdi_12m)} detalhe={`Até ${formatarMes(j?.referencia_12m)}`} />
    ) },
    { chave: "juroreal", indicador: "cdi", elemento: (
      <CartaoKpi rotulo="Juro real 12 meses" valor={formatarPercentual(j?.juro_real_12m)} detalhe="CDI descontado o IPCA (Fisher)" />
    ) },
    moeda("dolar", "Dólar (PTAX)"),
    moeda("euro", "Euro (PTAX)"),
  ];
}

export default function KpisVisaoGeral({ resumo, filtro }: Props) {
  const cartoes = [...cartoesInflacao(resumo), ...cartoesJurosCambio(resumo)].filter((c) => exibe(filtro, c.indicador));
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cartoes.map((c) => (
        <div key={c.chave} className="contents">{c.elemento}</div>
      ))}
    </div>
  );
}
