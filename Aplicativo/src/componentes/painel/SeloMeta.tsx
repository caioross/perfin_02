import type { StatusMeta } from "@/tipos/indicadores";

const ESTILOS: Record<StatusMeta, { texto: string; classe: string }> = {
  acima_do_teto: { texto: "Acima do teto", classe: "bg-alerta-suave text-alerta" },
  abaixo_do_piso: { texto: "Abaixo do piso", classe: "bg-atencao-suave text-atencao" },
  dentro_da_meta: { texto: "Dentro da meta", classe: "bg-marca-suave text-marca" },
  sem_dados: { texto: "Sem dados", classe: "bg-superficie-2 text-texto-suave" },
  meta_nao_cadastrada: { texto: "Meta não cadastrada", classe: "bg-superficie-2 text-texto-suave" },
};

export default function SeloMeta({ status }: { status: StatusMeta }) {
  const { texto, classe } = ESTILOS[status];
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${classe}`}>{texto}</span>;
}
