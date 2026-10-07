import type { PapelComAcesso } from "@/tipos/auth";

// Telas do Portal por perfil (Documentacao/regras-de-negocio.md §1 e §2).
export type ItemNavegacao = {
  href: string;
  rotulo: string;
  papeis: PapelComAcesso[];
  // Aparece direto na barra inferior do celular (as demais ficam em "Mais").
  principalMobile: boolean;
  // Mantém o filtro de período/indicadores na navegação.
  usaFiltro: boolean;
};

const AMBOS: PapelComAcesso[] = ["admin", "usuario"];

export const ITENS_NAVEGACAO: ItemNavegacao[] = [
  { href: "/visao-geral", rotulo: "Visão geral", papeis: AMBOS, principalMobile: true, usaFiltro: true },
  { href: "/inflacao", rotulo: "Inflação", papeis: AMBOS, principalMobile: true, usaFiltro: true },
  { href: "/juros", rotulo: "Juros", papeis: AMBOS, principalMobile: true, usaFiltro: true },
  { href: "/cambio", rotulo: "Câmbio", papeis: AMBOS, principalMobile: true, usaFiltro: true },
  { href: "/calculadoras", rotulo: "Calculadoras", papeis: AMBOS, principalMobile: false, usaFiltro: false },
  { href: "/relatorios", rotulo: "Relatório do mês", papeis: ["usuario"], principalMobile: false, usaFiltro: false },
  { href: "/agenda", rotulo: "Agenda", papeis: ["usuario"], principalMobile: false, usaFiltro: false },
  { href: "/assistente", rotulo: "Assistente", papeis: ["usuario"], principalMobile: false, usaFiltro: true },
  { href: "/admin", rotulo: "Administração", papeis: ["admin"], principalMobile: false, usaFiltro: false },
];

export function itensDoPapel(papel: PapelComAcesso): ItemNavegacao[] {
  return ITENS_NAVEGACAO.filter((item) => item.papeis.includes(papel));
}
