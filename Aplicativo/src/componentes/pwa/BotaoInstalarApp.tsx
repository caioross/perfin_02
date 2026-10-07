"use client";

import { useState } from "react";
import { useInstalarApp } from "@/hooks/useInstalarApp";

export default function BotaoInstalarApp() {
  const { modo, instalar } = useInstalarApp();
  const [mostrarPassos, setMostrarPassos] = useState(false);

  if (modo === "instalado" || modo === "indisponivel") return null;

  if (modo === "nativo") {
    return (
      <button type="button" onClick={instalar} className="w-full rounded-lg border border-borda px-3 py-2 text-left text-sm hover:bg-superficie-2">
        Instalar app
      </button>
    );
  }

  return (
    <div className="text-sm">
      <button
        type="button"
        onClick={() => setMostrarPassos((v) => !v)}
        aria-expanded={mostrarPassos}
        className="w-full rounded-lg border border-borda px-3 py-2 text-left hover:bg-superficie-2"
      >
        Instalar app
      </button>
      {mostrarPassos && (
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-texto-suave">
          <li>No Safari, toque em Compartilhar (quadrado com seta para cima).</li>
          <li>Escolha &quot;Adicionar à Tela de Início&quot;.</li>
          <li>Confirme em &quot;Adicionar&quot;.</li>
        </ol>
      )}
    </div>
  );
}
