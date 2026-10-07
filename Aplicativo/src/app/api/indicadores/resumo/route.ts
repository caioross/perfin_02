import { NextResponse } from "next/server";
import { lerFiltro } from "@/dominio/filtros";
import { verificarAcesso } from "@/lib/auth/sessao";
import { registrarErro } from "@/lib/erros";
import { obterResumoPainel } from "@/servicos/indicadores/resumo";
import type { ResumoOffline } from "@/tipos/offline";

// Resumo compacto (últimos 12 meses) que o service worker guarda para a página /offline.
// Só indicadores públicos do BCB; nenhum dado pessoal.
export async function GET() {
  if (!(await verificarAcesso())) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  try {
    const resumo = await obterResumoPainel(lerFiltro({}));
    const corpo: ResumoOffline = {
      gerado_em: new Date().toISOString(),
      itens: [
        { rotulo: "IPCA 12 meses", valor: resumo.meta?.ipca_12m ?? null, formato: "percentual" },
        { rotulo: "Selic meta (a.a.)", valor: resumo.juros?.selic_atual ?? null, formato: "percentual" },
        { rotulo: "CDI 12 meses", valor: resumo.juros?.cdi_12m ?? null, formato: "percentual" },
        { rotulo: "Juro real 12 meses", valor: resumo.juros?.juro_real_12m ?? null, formato: "percentual" },
        ...resumo.cambioPeriodo.map((m) => ({
          rotulo: m.indicador_codigo === "dolar" ? "Dólar (PTAX)" : "Euro (PTAX)",
          valor: m.ultimo_valor,
          formato: "cotacao" as const,
        })),
      ],
      destaques: resumo.insights.slice(0, 3).map((i) => i.texto),
    };
    return NextResponse.json(corpo, { headers: { "Cache-Control": "private, no-store" } });
  } catch (erro) {
    registrarErro("resumo offline", erro);
    return NextResponse.json({ erro: "Indisponível." }, { status: 502 });
  }
}
