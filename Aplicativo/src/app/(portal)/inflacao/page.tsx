import type { Metadata } from "next";
import { Suspense } from "react";
import Carregando from "@/componentes/estados/Carregando";
import EstadoErro from "@/componentes/estados/EstadoErro";
import CabecalhoPagina from "@/componentes/painel/CabecalhoPagina";
import FiltroPeriodo from "@/componentes/painel/FiltroPeriodo";
import PainelInflacao from "@/componentes/paineis/PainelInflacao";
import { lerFiltro } from "@/dominio/filtros";
import { exigirAcesso } from "@/lib/auth/sessao";
import { registrarErro } from "@/lib/erros";
import { obterDadosInflacao, type DadosInflacao } from "@/servicos/indicadores/paineis";

export const metadata: Metadata = { title: "Inflação" };

async function ConteudoInflacao({ searchParams }: { searchParams: PageProps<"/inflacao">["searchParams"] }) {
  await exigirAcesso();
  const filtro = lerFiltro(await searchParams);
  let dados: DadosInflacao;
  try {
    dados = await obterDadosInflacao(filtro);
  } catch (erro) {
    registrarErro("inflação", erro);
    return <EstadoErro />;
  }
  return <PainelInflacao dados={dados} filtro={filtro} />;
}

export default function PaginaInflacao({ searchParams }: PageProps<"/inflacao">) {
  return (
    <>
      <CabecalhoPagina titulo="Inflação" descricao="IPCA, IGP-M e INPC: variação mensal, acumulados e meta de inflação." />
      <Suspense fallback={null}>
        <FiltroPeriodo />
      </Suspense>
      <Suspense fallback={<Carregando texto="Carregando inflação…" />}>
        <ConteudoInflacao searchParams={searchParams} />
      </Suspense>
    </>
  );
}
