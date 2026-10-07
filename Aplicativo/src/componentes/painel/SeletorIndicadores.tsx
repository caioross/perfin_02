import { CODIGOS_INDICADORES } from "@/dominio/filtros";
import { NOMES_INDICADORES } from "@/dominio/nomesIndicadores";
import type { CodigoIndicador } from "@/tipos/indicadores";

type Props = { selecionados: string[]; aoAlterar: (lista: CodigoIndicador[]) => void };

// Seleção dos indicadores exibidos; ao menos um fica sempre marcado.
export default function SeletorIndicadores({ selecionados, aoAlterar }: Props) {
  function alternar(codigo: CodigoIndicador) {
    const marcado = selecionados.includes(codigo);
    const proximo = CODIGOS_INDICADORES.filter((c) => (c === codigo ? !marcado : selecionados.includes(c)));
    if (proximo.length > 0) aoAlterar(proximo);
  }
  return (
    <fieldset className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
      <legend className="sr-only">Indicadores</legend>
      {CODIGOS_INDICADORES.map((codigo) => (
        <label key={codigo} className="flex items-center gap-1.5">
          <input type="checkbox" checked={selecionados.includes(codigo)} onChange={() => alternar(codigo)} className="accent-[var(--marca)]" />
          {NOMES_INDICADORES[codigo]}
        </label>
      ))}
    </fieldset>
  );
}
