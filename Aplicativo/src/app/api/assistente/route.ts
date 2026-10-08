import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { montarContextoAssistente } from "@/dominio/assistente/montarContexto";
import { lerFiltro } from "@/dominio/filtros";
import { verificarAcesso } from "@/lib/auth/sessao";
import { registrarErro } from "@/lib/erros";
import { responderEmStreaming } from "@/servicos/assistente";
import { obterResumoPainel } from "@/servicos/indicadores/resumo";
import { consumirLimite } from "@/servicos/limites";

const LIMITE_PERGUNTAS = 20;
const JANELA_SEGUNDOS = 10 * 60;

const MAX_TEXTO_HISTORICO = 4000;

// Histórico: textos longos são truncados (não rejeitados) e vazios descartados — o Gemini
// recusa partes vazias e uma resposta longa não pode travar o resto da conversa.
const esquemaCorpo = z.object({
  pergunta: z.string().trim().min(1).max(1000),
  historico: z
    .array(z.object({ papel: z.enum(["usuario", "assistente"]), texto: z.string().max(20_000) }))
    .max(10)
    .transform((itens) =>
      itens
        .map((m) => ({ ...m, texto: m.texto.trim().slice(0, MAX_TEXTO_HISTORICO) }))
        .filter((m) => m.texto.length > 0),
    ),
  filtro: z.record(z.string(), z.string().max(100)).optional(),
});

function origemValida(request: NextRequest): boolean {
  const origem = request.headers.get("origin");
  return !origem || origem === request.nextUrl.origin;
}

// Chat com o Gemini sobre os indicadores do filtro. Os números do contexto são buscados
// aqui no servidor (RLS do usuário); o cliente só envia a pergunta e o filtro.
export async function POST(request: NextRequest) {
  if (!origemValida(request)) return NextResponse.json({ erro: "Origem não permitida." }, { status: 403 });
  const usuario = await verificarAcesso(["usuario"]);
  if (!usuario) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  if (!(await consumirLimite("assistente", LIMITE_PERGUNTAS, JANELA_SEGUNDOS))) {
    return NextResponse.json({ erro: "Limite de perguntas atingido. Aguarde alguns minutos." }, { status: 429 });
  }

  const corpo = esquemaCorpo.safeParse(await request.json().catch(() => null));
  if (!corpo.success) return NextResponse.json({ erro: "Pergunta inválida." }, { status: 400 });

  try {
    const filtro = lerFiltro(corpo.data.filtro ?? {});
    const resumo = await obterResumoPainel(filtro);
    const fluxo = await responderEmStreaming(montarContextoAssistente(resumo, filtro), corpo.data.historico, corpo.data.pergunta);
    return new Response(fluxo, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  } catch (erro) {
    registrarErro("assistente", erro);
    return NextResponse.json({ erro: "O assistente está indisponível no momento." }, { status: 502 });
  }
}
