"use client";

import { sair } from "@/app/login/acoes";
import { limparDadosLocais } from "@/hooks/useServiceWorker";

type Props = { rotulo?: string };

// Sai da conta apagando antes os caches do app no aparelho (PWA em celular compartilhado).
export default function BotaoSair({ rotulo = "Sair" }: Props) {
  async function sairLimpando() {
    await limparDadosLocais();
    await sair();
  }
  return (
    <form action={sairLimpando}>
      <button type="submit" className="w-full rounded-lg border border-borda px-3 py-2 text-left text-sm hover:bg-superficie-2">
        {rotulo}
      </button>
    </form>
  );
}
