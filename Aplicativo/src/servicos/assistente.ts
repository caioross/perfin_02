import "server-only";
import { GoogleGenAI } from "@google/genai";
import { INSTRUCAO_SISTEMA } from "@/dominio/assistente/montarContexto";
import { variavelServidor } from "@/lib/env";

export type MensagemChat = { papel: "usuario" | "assistente"; texto: string };

// Gera a resposta do Gemini em streaming de texto. O contexto (DADOS) vem do servidor,
// nunca do cliente; o histórico é só conversa.
export async function responderEmStreaming(
  contexto: string,
  historico: MensagemChat[],
  pergunta: string,
): Promise<ReadableStream<Uint8Array>> {
  const ai = new GoogleGenAI({ apiKey: variavelServidor("GEMINI_API_KEY") });
  const conteudos = [
    ...historico.map((m) => ({ role: m.papel === "usuario" ? "user" : "model", parts: [{ text: m.texto }] })),
    { role: "user", parts: [{ text: pergunta }] },
  ];
  const fluxo = await ai.models.generateContentStream({
    model: variavelServidor("GEMINI_MODEL"),
    contents: conteudos,
    config: {
      systemInstruction: `${INSTRUCAO_SISTEMA}\n\n${contexto}`,
      temperature: 0.2,
      maxOutputTokens: 1024,
    },
  });

  const codificador = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async pull(controle) {
      try {
        const { value, done } = await fluxo.next();
        if (done) {
          controle.close();
          return;
        }
        if (value.text) controle.enqueue(codificador.encode(value.text));
      } catch {
        controle.enqueue(codificador.encode("\n\n[Não foi possível concluir a resposta. Tente novamente.]"));
        controle.close();
      }
    },
  });
}
