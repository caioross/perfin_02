import type { Metadata } from "next";
import { Suspense } from "react";
import Carregando from "@/componentes/estados/Carregando";
import EstadoErro from "@/componentes/estados/EstadoErro";
import CabecalhoPagina from "@/componentes/painel/CabecalhoPagina";
import FiltroPeriodo from "@/componentes/painel/FiltroPeriodo";
import PainelJuros from "@/componentes/paineis/PainelJuros";
import { lerFiltro } from "@/dominio/filtros";
import { exigirAcesso } from "@/lib/auth/sessao";
import { registrarErro } from "@/lib/erros";
import { obterDadosJuros, type DadosJuros } from "@/servicos/indicadores/paineis";

export const metadata: Metadata = { title: "Juros" };

async function ConteudoJuros({ searchParams }: { searchParams: PageProps<"/juros">["searchParams"] }) {
  await exigirAcesso();
  const filtro = lerFiltro(await searchParams);
  let dados: DadosJuros;
  try {
    dados = await obterDadosJuros(filtro);
  } catch (erro) {
    registrarErro("juros", erro);
    return <EstadoErro />;
  }
  return <PainelJuros dados={dados} filtro={filtro} />;
}

export default function PaginaJuros({ searchParams }: PageProps<"/juros">) {
  return (
    <>
      <CabecalhoPagina titulo="Juros" descricao="Selic, decisões do Copom, CDI acumulado e juro real." />
      <Suspense fallback={null}>
        <FiltroPeriodo />
      </Suspense>
      <Suspense fallback={<Carregando texto="Carregando juros…" />}>
        <ConteudoJuros searchParams={searchParams} />
      </Suspense>
    </>
  );
}
