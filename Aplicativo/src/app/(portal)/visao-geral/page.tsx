import type { Metadata } from "next";
import { Suspense } from "react";
import Carregando from "@/componentes/estados/Carregando";
import EstadoErro from "@/componentes/estados/EstadoErro";
import CabecalhoPagina from "@/componentes/painel/CabecalhoPagina";
import FiltroPeriodo from "@/componentes/painel/FiltroPeriodo";
import KpisVisaoGeral from "@/componentes/painel/KpisVisaoGeral";
import ListaInsights from "@/componentes/painel/ListaInsights";
import { lerFiltro } from "@/dominio/filtros";
import { INSIGHTS_VISAO_GERAL } from "@/dominio/insights/limites";
import { exigirAcesso } from "@/lib/auth/sessao";
import { registrarErro } from "@/lib/erros";
import { formatarData } from "@/lib/formatacao";
import { obterResumoPainel, type ResumoPainel } from "@/servicos/indicadores/resumo";

export const metadata: Metadata = { title: "Visão geral" };

async function ConteudoVisaoGeral({ searchParams }: { searchParams: PageProps<"/visao-geral">["searchParams"] }) {
  await exigirAcesso();
  const filtro = lerFiltro(await searchParams);
  let resumo: ResumoPainel;
  try {
    resumo = await obterResumoPainel(filtro);
  } catch (erro) {
    registrarErro("visão geral", erro);
    return <EstadoErro />;
  }
  return (
    <>
      <p className="text-sm text-texto-suave">
        Período: {formatarData(filtro.periodo.inicio)} a {formatarData(filtro.periodo.fim)}
      </p>
      <KpisVisaoGeral resumo={resumo} filtro={filtro} />
      <section aria-labelledby="titulo-insights" className="space-y-3">
        <h2 id="titulo-insights" className="text-lg font-semibold">Principais destaques</h2>
        <ListaInsights insights={resumo.insights} limite={INSIGHTS_VISAO_GERAL} />
      </section>
    </>
  );
}

export default function PaginaVisaoGeral({ searchParams }: PageProps<"/visao-geral">) {
  return (
    <>
      <CabecalhoPagina titulo="Visão geral" descricao="Indicadores econômicos do Banco Central, com insights do período." />
      <Suspense fallback={null}>
        <FiltroPeriodo />
      </Suspense>
      <Suspense fallback={<Carregando texto="Carregando indicadores…" />}>
        <ConteudoVisaoGeral searchParams={searchParams} />
      </Suspense>
    </>
  );
}
