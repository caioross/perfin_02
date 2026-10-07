import type { Metadata } from "next";
import { Suspense } from "react";
import ChatAssistente from "@/componentes/assistente/ChatAssistente";
import Carregando from "@/componentes/estados/Carregando";
import CabecalhoPagina from "@/componentes/painel/CabecalhoPagina";
import FiltroPeriodo from "@/componentes/painel/FiltroPeriodo";
import { exigirAcesso } from "@/lib/auth/sessao";

export const metadata: Metadata = { title: "Assistente" };

async function ConteudoAssistente() {
  await exigirAcesso(["usuario"]);
  return (
    <>
      <FiltroPeriodo />
      <ChatAssistente />
    </>
  );
}

export default function PaginaAssistente() {
  return (
    <>
      <CabecalhoPagina titulo="Assistente"
        descricao="Pergunte sobre os indicadores. As respostas usam só os dados do período e dos indicadores filtrados." />
      <Suspense fallback={<Carregando />}>
        <ConteudoAssistente />
      </Suspense>
    </>
  );
}
