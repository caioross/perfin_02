"use client";

import { useRef, useState } from "react";

export type MensagemExibida = { id: number; papel: "usuario" | "assistente"; texto: string };

const MAX_HISTORICO = 10;
const MAX_TEXTO = 4000;

// Envia perguntas para /api/assistente e acumula a resposta em streaming.
export function useChatAssistente(filtro: Record<string, string>) {
  const [mensagens, setMensagens] = useState<MensagemExibida[]>([]);
  const [respondendo, setRespondendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const proximoId = useRef(1);

  function anexarResposta(id: number, trecho: string) {
    setMensagens((atual) => atual.map((m) => (m.id === id ? { ...m, texto: m.texto + trecho } : m)));
  }

  async function perguntar(pergunta: string) {
    const texto = pergunta.trim();
    if (!texto || respondendo) return;
    setErro(null);
    setRespondendo(true);
    const historico = mensagens
      .filter((m) => m.texto.trim() !== "")
      .slice(-MAX_HISTORICO)
      .map(({ papel, texto: t }) => ({ papel, texto: t.slice(0, MAX_TEXTO) }));
    const idPergunta = proximoId.current++;
    const idResposta = proximoId.current++;
    setMensagens((atual) => [...atual, { id: idPergunta, papel: "usuario", texto }, { id: idResposta, papel: "assistente", texto: "" }]);
    try {
      const resposta = await fetch("/api/assistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: texto, historico, filtro }),
      });
      if (!resposta.ok || !resposta.body) {
        const corpo = (await resposta.json().catch(() => null)) as { erro?: string } | null;
        throw new Error(corpo?.erro ?? "O assistente está indisponível no momento.");
      }
      const leitor = resposta.body.getReader();
      const decodificador = new TextDecoder();
      for (let parte = await leitor.read(); !parte.done; parte = await leitor.read()) {
        anexarResposta(idResposta, decodificador.decode(parte.value, { stream: true }));
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "O assistente está indisponível no momento.");
      setMensagens((atual) => atual.filter((m) => m.id !== idResposta || m.texto !== ""));
    } finally {
      setRespondendo(false);
    }
  }

  return { mensagens, respondendo, erro, perguntar };
}
