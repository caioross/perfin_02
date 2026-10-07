"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { parametrosDoFiltro } from "@/dominio/filtros";
import type { ItemNavegacao } from "@/dominio/navegacao";

type Props = { itens: ItemNavegacao[]; variante: "lateral" | "inferior" };

// Links do menu; preserva o filtro global ao navegar entre painéis.
export default function LinksNavegacao({ itens, variante }: Props) {
  const caminho = usePathname();
  const busca = useSearchParams();
  const query = new URLSearchParams(parametrosDoFiltro(busca)).toString();

  return (
    <ul className={variante === "lateral" ? "space-y-1" : "grid grid-cols-5"}>
      {itens.map((item) => {
        const ativo = caminho === item.href || caminho.startsWith(`${item.href}/`);
        const href = item.usaFiltro && query ? `${item.href}?${query}` : item.href;
        const estilo =
          variante === "lateral"
            ? `block rounded-lg px-3 py-2 text-sm ${ativo ? "bg-marca-suave font-semibold text-marca" : "hover:bg-superficie-2"}`
            : `flex h-14 items-center justify-center px-1 text-center text-xs ${ativo ? "font-semibold text-marca" : "text-texto-suave"}`;
        return (
          <li key={item.href}>
            <Link href={href} className={estilo} aria-current={ativo ? "page" : undefined}>
              {item.rotulo}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
