"use client";

import { useActionState } from "react";
import { verificarCodigoMfa, type EstadoVerificacao } from "@/app/login/mfa/acoes";

const ESTADO_INICIAL: EstadoVerificacao = { erro: null };

type Props = { fatorId: string };

export default function FormCodigoMfa({ fatorId }: Props) {
  const [estado, acao, enviando] = useActionState(verificarCodigoMfa, ESTADO_INICIAL);
  return (
    <form action={acao} className="space-y-3">
      <input type="hidden" name="fatorId" value={fatorId} />
      <div>
        <label htmlFor="codigo" className="block text-sm font-medium">Código do autenticador</label>
        <input id="codigo" name="codigo" inputMode="numeric" pattern="\d{6}" maxLength={6} required autoComplete="one-time-code"
          className="numero mt-1 w-full rounded-lg border border-borda bg-superficie px-3 py-2 text-center text-lg tracking-[0.4em]" />
      </div>
      {estado.erro && <p role="alert" className="text-sm text-alerta">{estado.erro}</p>}
      <button type="submit" disabled={enviando}
        className="w-full rounded-lg bg-marca px-4 py-2 font-medium text-white hover:bg-marca-forte disabled:opacity-60">
        {enviando ? "Verificando…" : "Verificar"}
      </button>
    </form>
  );
}
