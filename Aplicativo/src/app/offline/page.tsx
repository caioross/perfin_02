import type { Metadata } from "next";
import CartaoAutenticacao from "@/componentes/auth/CartaoAutenticacao";
import UltimosIndicadoresOffline from "@/componentes/pwa/UltimosIndicadoresOffline";

export const metadata: Metadata = { title: "Sem conexão" };

// Página estática guardada pelo service worker: aberta quando não há internet.
export default function PaginaOffline() {
  return (
    <CartaoAutenticacao titulo="Sem conexão" subtitulo="Agenda, Gmail, relatórios e assistente voltam quando a internet voltar.">
      <UltimosIndicadoresOffline />
    </CartaoAutenticacao>
  );
}
