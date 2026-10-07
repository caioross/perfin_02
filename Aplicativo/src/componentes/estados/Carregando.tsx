"use client";

import { useOffline } from "next/offline";

type Props = { texto?: string };

// Estado de carregamento ciente da conexão: offline, avisa que vai esperar a rede voltar.
export default function Carregando({ texto = "Carregando…" }: Props) {
  const offline = useOffline();
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 py-8 text-sm text-texto-suave">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-borda border-t-marca" aria-hidden="true" />
      {offline ? "Sem conexão: esta seção carrega quando a internet voltar." : texto}
    </div>
  );
}
