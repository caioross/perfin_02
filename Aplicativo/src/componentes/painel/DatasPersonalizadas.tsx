import { DATA_MINIMA } from "@/dominio/filtros";

type Campo = "de" | "ate";
type Props = { de: string | null; ate: string | null; aoAlterar: (campo: Campo, valor: string) => void };

export default function DatasPersonalizadas({ de, ate, aoAlterar }: Props) {
  const estiloCampo = "rounded-lg border border-borda bg-superficie px-2 py-1";
  return (
    <div className="flex flex-wrap items-end gap-3 text-sm">
      <label className="flex flex-col gap-1">
        De
        <input type="date" defaultValue={de ?? ""} min={DATA_MINIMA} onChange={(e) => aoAlterar("de", e.target.value)} className={estiloCampo} />
      </label>
      <label className="flex flex-col gap-1">
        Até
        <input type="date" defaultValue={ate ?? ""} min={DATA_MINIMA} onChange={(e) => aoAlterar("ate", e.target.value)} className={estiloCampo} />
      </label>
    </div>
  );
}
