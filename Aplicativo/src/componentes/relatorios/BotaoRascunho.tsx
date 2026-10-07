"use client";

import { useActionState } from "react";
import { criarRascunhoAcao, type EstadoRelatorio } from "@/app/(portal)/relatorios/acoes";
import MensagemAcao from "./MensagemAcao";

const INICIAL: EstadoRelatorio = { erro: null, reconectar: false, sucesso: null };

type Props = { relatorioId: string; jaCriado: boolean };

// Cria um rascunho no Gmail com o .xlsx anexado. O envio é sempre feito pelo usuário no Gmail.
export default function BotaoRascunho({ relatorioId, jaCriado }: Props) {
  const [estado, acao, enviando] = useActionState(criarRascunhoAcao, INICIAL);
  return (
    <div className="space-y-1">
      <form action={acao}>
        <input type="hidden" name="id" value={relatorioId} />
        <button type="submit" disabled={enviando} className="rounded-lg border border-borda px-3 py-1.5 text-sm hover:bg-superficie-2 disabled:opacity-60">
          {enviando ? "Criando rascunho…" : jaCriado ? "Criar outro rascunho no Gmail" : "Criar rascunho no Gmail"}
        </button>
      </form>
      <MensagemAcao estado={estado} />
    </div>
  );
}
