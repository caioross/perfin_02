"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type EventoInstalacao = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type ModoInstalacao = "indisponivel" | "nativo" | "ios" | "instalado";
type Ambiente = Exclude<ModoInstalacao, "nativo">;

const CONSULTA_STANDALONE = "(display-mode: standalone)";

function detectarIos(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

function lerAmbiente(): Ambiente {
  const navegadorIos = navigator as Navigator & { standalone?: boolean };
  if (window.matchMedia(CONSULTA_STANDALONE).matches || navegadorIos.standalone === true) return "instalado";
  return detectarIos() ? "ios" : "indisponivel";
}

function assinarModoExibicao(aoMudar: () => void): () => void {
  const consulta = window.matchMedia(CONSULTA_STANDALONE);
  consulta.addEventListener("change", aoMudar);
  return () => consulta.removeEventListener("change", aoMudar);
}

// Instalação do PWA: prompt nativo (Android/desktop Chromium) ou passo a passo no iOS.
export function useInstalarApp() {
  const ambiente = useSyncExternalStore(assinarModoExibicao, lerAmbiente, (): Ambiente => "indisponivel");
  const [evento, setEvento] = useState<EventoInstalacao | null>(null);
  const [instalouAgora, setInstalouAgora] = useState(false);

  useEffect(() => {
    const aoPermitir = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalacao);
    };
    const aoInstalar = () => {
      setEvento(null);
      setInstalouAgora(true);
    };
    window.addEventListener("beforeinstallprompt", aoPermitir);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", aoPermitir);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  const instalar = async () => {
    if (!evento) return;
    await evento.prompt();
    await evento.userChoice;
    setEvento(null);
  };

  const modo: ModoInstalacao = instalouAgora || ambiente === "instalado" ? "instalado" : evento ? "nativo" : ambiente;
  return { modo, instalar };
}
