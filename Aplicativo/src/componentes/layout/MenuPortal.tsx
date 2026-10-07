import { Suspense } from "react";
import { itensDoPapel } from "@/dominio/navegacao";
import BotaoInstalarApp from "@/componentes/pwa/BotaoInstalarApp";
import type { UsuarioAtual } from "@/tipos/auth";
import BotaoSair from "./BotaoSair";
import LinksNavegacao from "./LinksNavegacao";

type Props = { usuario: UsuarioAtual };

// Menu lateral (desktop) e barra inferior (celular), conforme o papel do usuário.
export default function MenuPortal({ usuario }: Props) {
  const itens = itensDoPapel(usuario.papel);
  const principais = itens.filter((i) => i.principalMobile);
  const mais = { href: "/mais", rotulo: "Mais", papeis: [usuario.papel], principalMobile: true, usaFiltro: false };

  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r border-borda bg-superficie p-4 md:flex">
        <div>
          <p className="text-lg font-semibold text-marca">Portal Perfin</p>
          <p className="truncate text-xs text-texto-suave" title={usuario.email}>
            {usuario.nome ?? usuario.email} · {usuario.papel === "admin" ? "Administrador" : "Usuário"}
          </p>
        </div>
        <nav aria-label="Menu principal" className="flex-1">
          <Suspense fallback={null}>
            <LinksNavegacao itens={itens} variante="lateral" />
          </Suspense>
        </nav>
        <div className="space-y-2">
          <BotaoInstalarApp />
          <BotaoSair />
        </div>
      </aside>
      <nav aria-label="Menu principal" className="area-segura-inferior fixed inset-x-0 bottom-0 z-40 border-t border-borda bg-superficie md:hidden">
        <Suspense fallback={null}>
          <LinksNavegacao itens={[...principais, mais]} variante="inferior" />
        </Suspense>
      </nav>
    </>
  );
}
