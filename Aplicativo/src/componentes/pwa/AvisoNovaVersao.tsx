"use client";

import { useServiceWorker } from "@/hooks/useServiceWorker";

// Registra o service worker e oferece a atualização quando há deploy novo (nunca troca sozinho).
export default function AvisoNovaVersao() {
  const { haNovaVersao, atualizar } = useServiceWorker();
  if (!haNovaVersao) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border border-borda bg-superficie p-3 shadow-lg md:bottom-6"
    >
      <span className="text-sm">Nova versão disponível.</span>
      <button
        type="button"
        onClick={atualizar}
        className="rounded-lg bg-marca px-3 py-1.5 text-sm font-medium text-white hover:bg-marca-forte"
      >
        Atualizar
      </button>
    </div>
  );
}
