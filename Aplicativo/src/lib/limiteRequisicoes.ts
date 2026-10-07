import "server-only";

// Limite simples de requisições por chave (em memória, por instância serverless).
// Protege o custo do Gemini contra uso abusivo; não substitui um limite distribuído.

type Janela = { inicio: number; contagem: number };
const janelas = new Map<string, Janela>();

export function permitirRequisicao(chave: string, maximo: number, janelaMs: number, agora = Date.now()): boolean {
  const atual = janelas.get(chave);
  if (!atual || agora - atual.inicio >= janelaMs) {
    janelas.set(chave, { inicio: agora, contagem: 1 });
    return true;
  }
  if (atual.contagem >= maximo) return false;
  atual.contagem += 1;
  return true;
}
