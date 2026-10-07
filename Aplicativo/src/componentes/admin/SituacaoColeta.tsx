import type { SaudeColeta } from "@/servicos/admin";

type Props = { item: SaudeColeta };

export default function SituacaoColeta({ item }: Props) {
  if (item.ultimo_status === "falha") return <span className="text-alerta">Falha na última coleta</span>;
  if (item.desatualizado) return <span className="text-atencao">Desatualizado</span>;
  return <span className="text-positivo">Em dia</span>;
}
