import { formatarPercentual } from "@/lib/formatacao";

type Props = { rotulo: string; valor: number | null };

// Item de uma lista <dl> com variação percentual colorida (alta em vermelho, queda em verde).
export default function ItemVariacao({ rotulo, valor }: Props) {
  const cor = valor == null || valor === 0 ? "" : valor > 0 ? "text-alerta" : "text-positivo";
  return (
    <div>
      <dt className="text-xs text-texto-suave">{rotulo}</dt>
      <dd className={`numero font-medium ${cor}`}>{formatarPercentual(valor)}</dd>
    </div>
  );
}
