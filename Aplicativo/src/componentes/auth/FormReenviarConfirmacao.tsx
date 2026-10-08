"use client";

import { useActionState } from "react";
import { reenviarConfirmacao, type EstadoReenvio } from "@/app/cadastro/acoes";

const ESTADO_INICIAL: EstadoReenvio = { mensagem: null };

type Props = { email: string };

// Reenvio do link de confirmação do cadastro (resposta sempre neutra).
export default function FormReenviarConfirmacao({ email }: Props) {
  const [estado, acao, enviando] = useActionState(reenviarConfirmacao, ESTADO_INICIAL);
  return (
    <form action={acao} className="space-y-2 text-sm">
      <input type="hidden" name="email" value={email} />
      <button type="submit" disabled={enviando} className="font-medium text-marca underline-offset-2 hover:underline disabled:opacity-60">
        {enviando ? "Reenviando…" : "Reenviar link de confirmação"}
      </button>
      {estado.mensagem && <p aria-live="polite" className="text-texto-suave">{estado.mensagem}</p>}
    </form>
  );
}
