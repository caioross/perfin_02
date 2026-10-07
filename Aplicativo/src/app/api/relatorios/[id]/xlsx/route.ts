import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { verificarAcesso } from "@/lib/auth/sessao";
import { ErroReconexaoGoogle, registrarErro } from "@/lib/erros";
import { MIME_XLSX } from "@/servicos/google/planilhas";
import { baixarXlsx } from "@/servicos/relatorios";

// Download do relatório em Excel, exportado pelo Drive. Só o dono (RLS) consegue baixar.
export async function GET(request: NextRequest, { params }: RouteContext<"/api/relatorios/[id]/xlsx">) {
  const usuario = await verificarAcesso(["usuario"]);
  if (!usuario) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });

  const id = z.string().uuid().safeParse((await params).id);
  if (!id.success) return NextResponse.json({ erro: "Relatório inválido." }, { status: 400 });

  try {
    const arquivo = await baixarXlsx(usuario, id.data);
    if (!arquivo) return NextResponse.json({ erro: "Relatório não encontrado." }, { status: 404 });
    return new NextResponse(arquivo.conteudo, {
      headers: {
        "Content-Type": MIME_XLSX,
        "Content-Disposition": `attachment; filename="${arquivo.nome}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (erro) {
    registrarErro("download xlsx", erro);
    if (erro instanceof ErroReconexaoGoogle) {
      return NextResponse.redirect(new URL("/relatorios?reconectar=1", request.url));
    }
    return NextResponse.json({ erro: "Não foi possível baixar o arquivo." }, { status: 502 });
  }
}
