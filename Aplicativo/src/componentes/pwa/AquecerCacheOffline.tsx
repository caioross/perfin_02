"use client";

import { useEffect } from "react";

const CHAVE_SESSAO = "perfin-cache-offline-aquecido";

// Busca o resumo de indicadores uma vez por sessão para o service worker guardá-lo
// (é o que a página /offline mostra sem internet). Só dados públicos do BCB.
export default function AquecerCacheOffline() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(CHAVE_SESSAO)) return;
    } catch {
      return;
    }
    const controle = new AbortController();
    fetch("/api/indicadores/resumo", { signal: controle.signal })
      .then((resposta) => {
        // Marca só depois de dar certo: com rede instável, tenta de novo na próxima tela.
        if (resposta.ok) sessionStorage.setItem(CHAVE_SESSAO, "1");
      })
      .catch(() => undefined);
    return () => controle.abort();
  }, []);
  return null;
}
