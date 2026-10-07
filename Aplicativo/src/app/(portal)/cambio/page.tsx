import type { Metadata } from "next";
import { Suspense } from "react";
import Carregando from "@/componentes/estados/Carregando";
import EstadoErro from "@/componentes/estados/EstadoErro";
import CabecalhoPagina from "@/componentes/painel/CabecalhoPagina";
import FiltroPeriodo from "@/componentes/painel/FiltroPeriodo";
import PainelCambio from "@/componentes/paineis/PainelCambio";
import { lerFiltro } from "@/dominio/filtros";
import { exigirAcesso } from "@/lib/auth/sessao";
import { registrarErro } from "@/lib/erros";
import { obterDadosCambio, type DadosCambio } from "@/servicos/indicadores/paineis";

export const metadata: Metadata = { title: "Câmbio" };

async function ConteudoCambio({ searchParams }: { searchParams: PageProps<"/cambio">["searchParams"] }) {
  await exigirAcesso();
  const filtro = lerFiltro(await searchParams);
  let dados: DadosCambio;
  try {
    dados = await obterDadosCambio(filtro);
  } catch (erro) {
    registrarErro("câmbio", erro);
    return <EstadoErro />;
  }
  return <PainelCambio dados={dados} />;
}

export default function PaginaCambio({ searchParams }: PageProps<"/cambio">) {
  return (
    <>
      <CabecalhoPagina titulo="Câmbio" descricao="Dólar e euro (PTAX venda): cotação, variações e volatilidade." />
      <Suspense fallback={null}>
        <FiltroPeriodo />
      </Suspense>
      <Suspense fallback={<Carregando texto="Carregando câmbio…" />}>
        <ConteudoCambio searchParams={searchParams} />
      </Suspense>
    </>
  );
}
