"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verificarAcesso } from "@/lib/auth/sessao";
import { ErroReconexaoGoogle, mensagemParaUsuario, registrarErro } from "@/lib/erros";
import { criarRascunhoRelatorio, gerarRelatorio } from "@/servicos/relatorios";

export type EstadoRelatorio = { erro: string | null; reconectar: boolean; sucesso: string | null };

const SESSAO_EXPIRADA: EstadoRelatorio = { erro: "Sua sessão expirou. Entre novamente.", reconectar: false, sucesso: null };

function falha(contexto: string, erro: unknown): EstadoRelatorio {
  registrarErro(contexto, erro);
  return { erro: mensagemParaUsuario(erro), reconectar: erro instanceof ErroReconexaoGoogle, sucesso: null };
}

export async function gerarRelatorioAcao(_: EstadoRelatorio, formulario: FormData): Promise<EstadoRelatorio> {
  const usuario = await verificarAcesso(["usuario"]);
  if (!usuario) return SESSAO_EXPIRADA;
  const mes = z.string().regex(/^\d{4}-\d{2}-01$/).safeParse(formulario.get("mes"));
  if (!mes.success) return { erro: "Escolha um mês de referência.", reconectar: false, sucesso: null };
  try {
    await gerarRelatorio(usuario, mes.data);
  } catch (erro) {
    return falha("gerar relatório", erro);
  }
  revalidatePath("/relatorios");
  return { erro: null, reconectar: false, sucesso: "Planilha criada no seu Google Drive." };
}

// Cria um RASCUNHO no Gmail (nunca envia).
export async function criarRascunhoAcao(_: EstadoRelatorio, formulario: FormData): Promise<EstadoRelatorio> {
  const usuario = await verificarAcesso(["usuario"]);
  if (!usuario) return SESSAO_EXPIRADA;
  const id = z.string().uuid().safeParse(formulario.get("id"));
  if (!id.success) return { erro: "Relatório inválido.", reconectar: false, sucesso: null };
  try {
    await criarRascunhoRelatorio(usuario, id.data);
  } catch (erro) {
    return falha("criar rascunho", erro);
  }
  revalidatePath("/relatorios");
  return { erro: null, reconectar: false, sucesso: "Rascunho criado no Gmail. Revise e envie pelo próprio Gmail." };
}
