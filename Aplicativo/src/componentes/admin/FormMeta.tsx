"use client";

import { useActionState } from "react";
import { salvarMetaAcao, type EstadoAdmin } from "@/app/(portal)/admin/acoes";
import CampoFormulario from "@/componentes/formulario/CampoFormulario";

const INICIAL: EstadoAdmin = { erro: null, sucesso: null };

type Props = { proximoAno: number };

export default function FormMeta({ proximoAno }: Props) {
  const [estado, acao, enviando] = useActionState(salvarMetaAcao, INICIAL);
  return (
    <form action={acao} className="grid grid-cols-1 gap-3 rounded-xl border border-borda bg-superficie p-4 sm:grid-cols-4 sm:items-end">
      <CampoFormulario prefixo="meta" rotulo="Ano" name="ano" type="number" min="1999" max="2100" defaultValue={proximoAno} />
      <CampoFormulario prefixo="meta" rotulo="Centro (%)" name="centro" type="number" step="0.01" min="0.01" max="50" />
      <CampoFormulario prefixo="meta" rotulo="Tolerância (p.p.)" name="tolerancia" type="number" step="0.01" min="0" max="10" />
      <button type="submit" disabled={enviando} className="rounded-lg bg-marca px-4 py-2 font-medium text-white hover:bg-marca-forte disabled:opacity-60">
        {enviando ? "Salvando…" : "Salvar meta"}
      </button>
      <div aria-live="polite" className="sm:col-span-4">
        {estado.erro && <p role="alert" className="text-sm text-alerta">{estado.erro}</p>}
        {estado.sucesso && <p className="text-sm text-positivo">{estado.sucesso}</p>}
      </div>
    </form>
  );
}
