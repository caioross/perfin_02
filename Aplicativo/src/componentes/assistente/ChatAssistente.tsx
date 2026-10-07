"use client";

import { useSearchParams } from "next/navigation";
import { useOffline } from "next/offline";
import { useState, type FormEvent } from "react";
import { parametrosDoFiltro } from "@/dominio/filtros";
import { useChatAssistente } from "@/hooks/useChatAssistente";
import PerguntasSugeridas from "./PerguntasSugeridas";

export default function ChatAssistente() {
  const filtro = parametrosDoFiltro(useSearchParams());
  const { mensagens, respondendo, erro, perguntar } = useChatAssistente(filtro);
  const [pergunta, setPergunta] = useState("");
  const offline = useOffline();

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    perguntar(pergunta);
    setPergunta("");
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-borda bg-superficie p-4">
      {mensagens.length === 0 && <PerguntasSugeridas aoEscolher={perguntar} desabilitado={respondendo || offline} />}
      <ol aria-live="polite" className="space-y-3">
        {mensagens.map((m) => (
          <li key={m.id} className={m.papel === "usuario" ? "ml-auto max-w-[85%] rounded-xl bg-marca-suave px-3 py-2" : "max-w-[95%] whitespace-pre-wrap rounded-xl bg-superficie-2 px-3 py-2"}>
            <span className="sr-only">{m.papel === "usuario" ? "Você:" : "Assistente:"}</span>
            {m.texto || (respondendo ? "Analisando os dados…" : "")}
          </li>
        ))}
      </ol>
      {erro && <p role="alert" className="text-sm text-alerta">{erro}</p>}
      {offline && <p className="text-sm text-atencao">O assistente precisa de internet.</p>}
      <form onSubmit={enviar} className="flex gap-2">
        <label htmlFor="pergunta" className="sr-only">Sua pergunta</label>
        <input id="pergunta" value={pergunta} onChange={(e) => setPergunta(e.target.value)} maxLength={1000}
          placeholder="Pergunte sobre os indicadores do período…" className="flex-1 rounded-lg border border-borda bg-superficie px-3 py-2" />
        <button type="submit" disabled={respondendo || offline || !pergunta.trim()}
          className="rounded-lg bg-marca px-4 py-2 font-medium text-white hover:bg-marca-forte disabled:opacity-60">
          Enviar
        </button>
      </form>
      <p className="text-xs text-texto-suave">Respostas geradas por IA a partir dos dados exibidos no Portal. Não é recomendação de investimento.</p>
    </section>
  );
}
