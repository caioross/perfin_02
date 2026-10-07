"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { CODIGOS_INDICADORES, type PresetPeriodo } from "@/dominio/filtros";
import BotoesPeriodo from "./BotoesPeriodo";
import DatasPersonalizadas from "./DatasPersonalizadas";
import SeletorIndicadores from "./SeletorIndicadores";

type Props = { mostrarIndicadores?: boolean };

// Filtro global (período + indicadores) guardado na URL: compartilhável por link.
// A validação definitiva é feita no servidor (lerFiltro).
export default function FiltroPeriodo({ mostrarIndicadores = true }: Props) {
  const roteador = useRouter();
  const caminho = usePathname();
  const busca = useSearchParams();
  const [pendente, iniciarTransicao] = useTransition();

  const preset = (busca.get("periodo") as PresetPeriodo | null) ?? "12m";
  const selecionados = busca.get("ind")?.split(",") ?? [...CODIGOS_INDICADORES];

  function atualizar(alteracoes: Record<string, string | null>) {
    const nova = new URLSearchParams(busca.toString());
    Object.entries(alteracoes).forEach(([chave, valor]) => (valor ? nova.set(chave, valor) : nova.delete(chave)));
    iniciarTransicao(() => roteador.replace(`${caminho}?${nova.toString()}`, { scroll: false }));
  }

  return (
    <section aria-label="Filtro" aria-busy={pendente} className="space-y-3 rounded-xl border border-borda bg-superficie p-3">
      <BotoesPeriodo
        selecionado={preset}
        aoEscolher={(opcao) => atualizar({ periodo: opcao, ...(opcao === "personalizado" ? {} : { de: null, ate: null }) })}
      />
      {preset === "personalizado" && (
        <DatasPersonalizadas de={busca.get("de")} ate={busca.get("ate")} aoAlterar={(campo, valor) => atualizar({ [campo]: valor })} />
      )}
      {mostrarIndicadores && (
        <SeletorIndicadores
          selecionados={selecionados}
          aoAlterar={(lista) => atualizar({ ind: lista.length === CODIGOS_INDICADORES.length ? null : lista.join(",") })}
        />
      )}
    </section>
  );
}
