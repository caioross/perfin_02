"use client";

import { useActionState } from "react";
import { entrarComoAdmin, type EstadoLogin } from "@/app/login/acoes";

const ESTADO_INICIAL: EstadoLogin = { erro: null };

export default function FormLoginAdmin() {
  const [estado, acao, enviando] = useActionState(entrarComoAdmin, ESTADO_INICIAL);
  return (
    <form action={acao} className="space-y-3">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="username"
          className="mt-1 w-full rounded-lg border border-borda bg-superficie px-3 py-2" />
      </div>
      <div>
        <label htmlFor="senha" className="block text-sm font-medium">Senha</label>
        <input id="senha" name="senha" type="password" required autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-borda bg-superficie px-3 py-2" />
      </div>
      {estado.erro && <p role="alert" className="text-sm text-alerta">{estado.erro}</p>}
      <button type="submit" disabled={enviando}
        className="w-full rounded-lg border border-borda px-4 py-2 font-medium hover:bg-superficie-2 disabled:opacity-60">
        {enviando ? "Entrando…" : "Entrar como administrador"}
      </button>
    </form>
  );
}
