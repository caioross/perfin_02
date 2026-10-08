import "server-only";

// Limite simples de tentativas por chave (em memória, por instância serverless), usado no login,
// no cadastro e na recuperação de senha, somado aos limites nativos do Supabase Auth.
// Não é distribuído: o limite do assistente (custo do Gemini) fica no banco (servicos/limites.ts).

type Janela = { inicio: number; contagem: number };
const janelas = new Map<string, Janela>();
const MAXIMO_CHAVES = 10_000;

// Remove janelas vencidas para o mapa não crescer sem limite.
function limparVencidas(agora: number, janelaMs: number): void {
  for (const [chave, janela] of janelas) {
    if (agora - janela.inicio >= janelaMs) janelas.delete(chave);
  }
}

export function permitirRequisicao(chave: string, maximo: number, janelaMs: number, agora = Date.now()): boolean {
  if (janelas.size >= MAXIMO_CHAVES) limparVencidas(agora, janelaMs);
  const atual = janelas.get(chave);
  if (!atual || agora - atual.inicio >= janelaMs) {
    janelas.set(chave, { inicio: agora, contagem: 1 });
    return true;
  }
  if (atual.contagem >= maximo) return false;
  atual.contagem += 1;
  return true;
}
