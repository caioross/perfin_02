import { PRESETS_PERIODO, ROTULOS_PERIODO, type PresetPeriodo } from "@/dominio/filtros";

type Props = { selecionado: PresetPeriodo; aoEscolher: (preset: PresetPeriodo) => void };

export default function BotoesPeriodo({ selecionado, aoEscolher }: Props) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Período">
      {PRESETS_PERIODO.map((opcao) => (
        <button
          key={opcao}
          type="button"
          aria-pressed={selecionado === opcao}
          onClick={() => aoEscolher(opcao)}
          className={`rounded-full px-3 py-1 text-sm ${selecionado === opcao ? "bg-marca text-white" : "bg-superficie-2 hover:bg-marca-suave"}`}
        >
          {ROTULOS_PERIODO[opcao]}
        </button>
      ))}
    </div>
  );
}
