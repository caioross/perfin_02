import type { Metadata } from "next";
import { Suspense } from "react";
import Carregando from "@/componentes/estados/Carregando";
import EstadoErro from "@/componentes/estados/EstadoErro";
import EstadoVazio from "@/componentes/estados/EstadoVazio";
import CabecalhoPagina from "@/componentes/painel/CabecalhoPagina";
import FormGerarRelatorio from "@/componentes/relatorios/FormGerarRelatorio";
import ListaRelatorios from "@/componentes/relatorios/ListaRelatorios";
import MensagemAcao from "@/componentes/relatorios/MensagemAcao";
import { exigirAcesso } from "@/lib/auth/sessao";
import { registrarErro } from "@/lib/erros";
import { listarMesesDisponiveis, listarRelatorios } from "@/servicos/relatorios";
import type { Relatorio } from "@/tipos/google";

export const metadata: Metadata = { title: "Relatório do mês" };

const AVISO_RECONEXAO = { erro: "Sua conexão com o Google expirou. Entre novamente com o Google.", reconectar: true, sucesso: null };

async function ConteudoRelatorios({ searchParams }: { searchParams: PageProps<"/relatorios">["searchParams"] }) {
  await exigirAcesso(["usuario"]);
  const pedirReconexao = (await searchParams).reconectar === "1";
  let meses: string[];
  let relatorios: Relatorio[];
  try {
    [meses, relatorios] = await Promise.all([listarMesesDisponiveis(), listarRelatorios()]);
  } catch (erro) {
    registrarErro("relatórios", erro);
    return <EstadoErro />;
  }
  return (
    <>
      {pedirReconexao && <MensagemAcao estado={AVISO_RECONEXAO} />}
      {meses.length > 0 ? (
        <FormGerarRelatorio meses={meses} />
      ) : (
        <EstadoVazio titulo="Ainda não há meses com IPCA publicado" descricao="Aguarde a primeira coleta de indicadores." />
      )}
      <section aria-labelledby="titulo-gerados" className="space-y-3">
        <h2 id="titulo-gerados" className="text-lg font-semibold">Relatórios gerados</h2>
        <ListaRelatorios relatorios={relatorios} />
      </section>
    </>
  );
}

export default function PaginaRelatorios({ searchParams }: PageProps<"/relatorios">) {
  return (
    <>
      <CabecalhoPagina titulo="Relatório do mês"
        descricao="Gera uma Planilha Google no seu Drive com o resumo dos indicadores; baixe em Excel ou crie um rascunho no Gmail." />
      <Suspense fallback={<Carregando />}>
        <ConteudoRelatorios searchParams={searchParams} />
      </Suspense>
    </>
  );
}
