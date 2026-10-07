"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { exigirAdminAntesDoMfa } from "@/lib/auth/sessao";
import { permitirRequisicao } from "@/lib/limiteRequisicoes";

export type CadastroMfa = { fatorId: string; qrCode: string; segredo: string } | { erro: string };
export type EstadoVerificacao = { erro: string | null };

// Cadastra um autenticador TOTP novo (remove tentativas anteriores não verificadas).
// Se já existe um autenticador verificado, recusa: trocar de aparelho exige o Dashboard.
export async function iniciarCadastroMfa(): Promise<CadastroMfa> {
  const { supabase } = await exigirAdminAntesDoMfa();
  const { data: fatores } = await supabase.auth.mfa.listFactors();
  const totp = (fatores?.all ?? []).filter((f) => f.factor_type === "totp");
  if (totp.some((f) => f.status === "verified")) {
    return { erro: "Já existe um autenticador cadastrado. Use o código dele para entrar." };
  }
  await Promise.all(totp.map((f) => supabase.auth.mfa.unenroll({ factorId: f.id })));

  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Portal Perfin" });
  if (error || !data) return { erro: "Não foi possível iniciar o cadastro do autenticador." };
  return { fatorId: data.id, qrCode: data.totp.qr_code, segredo: data.totp.secret };
}

const esquemaCodigo = z.object({
  fatorId: z.string().uuid(),
  codigo: z.string().regex(/^\d{6}$/),
});

export async function verificarCodigoMfa(_estado: EstadoVerificacao, formulario: FormData): Promise<EstadoVerificacao> {
  const { supabase, userId } = await exigirAdminAntesDoMfa();
  const entrada = esquemaCodigo.safeParse({ fatorId: formulario.get("fatorId"), codigo: formulario.get("codigo") });
  if (!entrada.success) return { erro: "Informe o código de 6 dígitos do aplicativo autenticador." };
  if (!permitirRequisicao(`mfa:${userId}`, 5, 5 * 60 * 1000)) {
    return { erro: "Muitas tentativas. Aguarde alguns minutos." };
  }
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: entrada.data.fatorId,
    code: entrada.data.codigo,
  });
  if (error) return { erro: "Código inválido ou expirado." };
  redirect("/admin");
}
