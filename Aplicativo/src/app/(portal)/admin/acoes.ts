"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verificarAcesso } from "@/lib/auth/sessao";
import { registrarErro } from "@/lib/erros";
import { definirAtivo, definirBloqueio, salvarMeta } from "@/servicos/admin";

export type EstadoAdmin = { erro: string | null; sucesso: string | null };

const NEGADO: EstadoAdmin = { erro: "Acesso negado.", sucesso: null };

// Bloqueia/desbloqueia um usuário (Google ou e-mail). O RLS recusa admins e qualquer outro alvo.
export async function alternarBloqueioAcao(formulario: FormData): Promise<void> {
  if (!(await verificarAcesso(["admin"]))) return;
  const entrada = z
    .object({ userId: z.string().uuid(), bloquear: z.enum(["sim", "nao"]) })
    .safeParse(Object.fromEntries(formulario));
  if (!entrada.success) return;
  const alterado = await definirBloqueio(entrada.data.userId, entrada.data.bloquear === "sim");
  if (!alterado) registrarErro("admin bloqueio", new Error("alteração recusada pelo RLS"));
  revalidatePath("/admin");
}

export async function alternarIndicadorAcao(formulario: FormData): Promise<void> {
  if (!(await verificarAcesso(["admin"]))) return;
  const entrada = z
    .object({ codigo: z.string().regex(/^[a-z_]{2,20}$/), ativo: z.enum(["sim", "nao"]) })
    .safeParse(Object.fromEntries(formulario));
  if (!entrada.success) return;
  try {
    await definirAtivo(entrada.data.codigo, entrada.data.ativo === "sim");
  } catch (erro) {
    registrarErro("admin catálogo", erro);
  }
  revalidatePath("/admin");
}

const esquemaMeta = z
  .object({
    ano: z.coerce.number().int().min(1999).max(2100),
    centro: z.coerce.number().positive().max(50),
    tolerancia: z.coerce.number().min(0).max(10),
  })
  .refine((m) => m.centro - m.tolerancia >= 0, { message: "O piso da meta não pode ser negativo." });

export async function salvarMetaAcao(_: EstadoAdmin, formulario: FormData): Promise<EstadoAdmin> {
  const admin = await verificarAcesso(["admin"]);
  if (!admin) return NEGADO;
  const entrada = esquemaMeta.safeParse(Object.fromEntries(formulario));
  if (!entrada.success) return { erro: entrada.error.issues[0]?.message ?? "Dados inválidos.", sucesso: null };
  try {
    await salvarMeta(entrada.data.ano, entrada.data.centro, entrada.data.tolerancia, admin.id);
  } catch (erro) {
    registrarErro("admin meta", erro);
    return { erro: "Não foi possível salvar a meta.", sucesso: null };
  }
  revalidatePath("/admin");
  return { erro: null, sucesso: `Meta de ${entrada.data.ano} salva.` };
}
