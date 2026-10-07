"use client";

import { useEffect, useState } from "react";

// Registra o service worker e avisa quando há uma nova versão esperando para ativar.
// A versão (commit do deploy) entra na URL do sw.js para forçar a atualização a cada deploy.
export function useServiceWorker() {
  const [esperando, setEsperando] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    let ativo = true;
    const versao = encodeURIComponent(process.env.NEXT_PUBLIC_VERSAO_APP ?? "dev");

    const observarInstalacao = (registro: ServiceWorkerRegistration) => {
      const novo = registro.installing;
      novo?.addEventListener("statechange", () => {
        if (novo.state === "installed" && navigator.serviceWorker.controller && ativo) setEsperando(novo);
      });
    };

    navigator.serviceWorker
      .register(`/sw.js?v=${versao}`, { scope: "/", updateViaCache: "none" })
      .then((registro) => {
        if (registro.waiting && navigator.serviceWorker.controller && ativo) setEsperando(registro.waiting);
        registro.addEventListener("updatefound", () => observarInstalacao(registro));
      })
      .catch(() => undefined);

    let recarregou = false;
    const aoTrocarControlador = () => {
      if (recarregou) return;
      recarregou = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", aoTrocarControlador);
    return () => {
      ativo = false;
      navigator.serviceWorker.removeEventListener("controllerchange", aoTrocarControlador);
    };
  }, []);

  const atualizar = () => esperando?.postMessage({ tipo: "PULAR_ESPERA" });
  return { haNovaVersao: esperando !== null, atualizar };
}

// Apaga os caches do app (chamado no logout): nada fica no aparelho para o próximo usuário.
export async function limparDadosLocais(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    navigator.serviceWorker?.controller?.postMessage({ tipo: "LIMPAR_DADOS" });
    if ("caches" in window) {
      const nomes = await caches.keys();
      await Promise.all(nomes.map((nome) => caches.delete(nome)));
    }
    sessionStorage.clear();
  } catch {
    // Sem suporte a cache/armazenamento: não há o que limpar.
  }
}
