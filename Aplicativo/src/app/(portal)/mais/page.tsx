import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Carregando from "@/componentes/estados/Carregando";
import BotaoSair from "@/componentes/layout/BotaoSair";
import CabecalhoPagina from "@/componentes/painel/CabecalhoPagina";
import BotaoInstalarApp from "@/componentes/pwa/BotaoInstalarApp";
import { itensDoPapel } from "@/dominio/navegacao";
import { exigirAcesso } from "@/lib/auth/sessao";

export const metadata: Metadata = { title: "Mais" };

// Menu completo no celular (a barra inferior mostra só as telas principais).
async function ConteudoMais() {
  const usuario = await exigirAcesso();
  return (
    <>
      <p className="text-sm text-texto-suave">{usuario.nome ?? usuario.email}</p>
      <nav aria-label="Todas as telas">
        <ul className="divide-y divide-borda rounded-xl border border-borda bg-superficie">
          {itensDoPapel(usuario.papel).map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block px-4 py-3 hover:bg-superficie-2">{item.rotulo}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="space-y-2">
        <BotaoInstalarApp />
        <BotaoSair />
      </div>
    </>
  );
}

export default function PaginaMais() {
  return (
    <>
      <CabecalhoPagina titulo="Mais" />
      <Suspense fallback={<Carregando />}>
        <ConteudoMais />
      </Suspense>
    </>
  );
}
