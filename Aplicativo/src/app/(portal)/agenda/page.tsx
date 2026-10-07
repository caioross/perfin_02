import type { Metadata } from "next";
import { Suspense } from "react";
import ListaEventos from "@/componentes/agenda/ListaEventos";
import BotaoEntrarGoogle from "@/componentes/auth/BotaoEntrarGoogle";
import Carregando from "@/componentes/estados/Carregando";
import EstadoErro from "@/componentes/estados/EstadoErro";
import CabecalhoPagina from "@/componentes/painel/CabecalhoPagina";
import { exigirAcesso } from "@/lib/auth/sessao";
import { ErroReconexaoGoogle, registrarErro } from "@/lib/erros";
import { listarProximosEventos } from "@/servicos/google/agenda";
import { obterAccessToken } from "@/servicos/google/tokens";
import type { EventoAgenda } from "@/tipos/google";

export const metadata: Metadata = { title: "Agenda" };

async function ConteudoAgenda() {
  const usuario = await exigirAcesso(["usuario"]);
  let eventos: EventoAgenda[];
  try {
    eventos = await listarProximosEventos(await obterAccessToken(usuario.id), new Date());
  } catch (erro) {
    registrarErro("agenda", erro);
    if (erro instanceof ErroReconexaoGoogle) {
      return (
        <EstadoErro mensagem={erro.message}>
          <BotaoEntrarGoogle rotulo="Reconectar conta Google" />
        </EstadoErro>
      );
    }
    return <EstadoErro />;
  }
  return <ListaEventos eventos={eventos} />;
}

export default function PaginaAgenda() {
  return (
    <>
      <CabecalhoPagina titulo="Agenda" descricao="Suas próximas reuniões no Google Agenda (somente leitura)." />
      <Suspense fallback={<Carregando texto="Carregando reuniões…" />}>
        <ConteudoAgenda />
      </Suspense>
    </>
  );
}
