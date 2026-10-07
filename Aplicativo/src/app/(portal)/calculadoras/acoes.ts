"use server";

import { z } from "zod";
import { verificarAcesso } from "@/lib/auth/sessao";
import { mensagemParaUsuario, registrarErro } from "@/lib/erros";
import {
  corrigirValor,
  poderDeCompra,
  reajusteContrato,
  rendimentoRealCdi,
  type ResultadoCorrecao,
  type ResultadoPoderCompra,
  type ResultadoReajuste,
  type ResultadoRendimento,
} from "@/servicos/calculadoras";

export type EstadoCalculo<T> = { erro: string | null; resultado: T | null };

const valor = z.coerce.number({ error: "Informe um valor numérico." }).positive("O valor deve ser maior que zero.").max(1e12, "Valor acima do limite.");
const mes = z.string().regex(/^\d{4}-\d{2}$/, "Mês inválido.").transform((m) => `${m}-01`);
const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");
const indice = z.enum(["ipca", "igpm", "inpc"], { error: "Índice inválido." });

// Executa o cálculo com autenticação no servidor, validação e erro genérico (falha fechada).
async function executar<E extends z.ZodType, T>(
  esquema: E,
  formulario: FormData,
  calculo: (entrada: z.output<E>) => Promise<T>,
): Promise<EstadoCalculo<T>> {
  if (!(await verificarAcesso())) return { erro: "Sua sessão expirou. Entre novamente.", resultado: null };
  const entrada = esquema.safeParse(Object.fromEntries(formulario));
  if (!entrada.success) return { erro: entrada.error.issues[0]?.message ?? "Dados inválidos.", resultado: null };
  try {
    return { erro: null, resultado: await calculo(entrada.data) };
  } catch (erro) {
    registrarErro("calculadora", erro);
    return { erro: mensagemParaUsuario(erro), resultado: null };
  }
}

export async function calcularCorrecao(_: EstadoCalculo<ResultadoCorrecao>, formulario: FormData) {
  const esquema = z.object({ indice, valor, inicio: mes, fim: mes });
  return executar(esquema, formulario, (e) => corrigirValor(e.indice, e.valor, e.inicio, e.fim));
}

export async function calcularReajuste(_: EstadoCalculo<ResultadoReajuste[]>, formulario: FormData) {
  const esquema = z.object({ valor, aniversario: mes });
  return executar(esquema, formulario, (e) => reajusteContrato(e.valor, e.aniversario));
}

export async function calcularPoderCompra(_: EstadoCalculo<ResultadoPoderCompra>, formulario: FormData) {
  const esquema = z.object({ valor, inicio: mes, fim: mes });
  return executar(esquema, formulario, (e) => poderDeCompra(e.valor, e.inicio, e.fim));
}

export async function calcularRendimento(_: EstadoCalculo<ResultadoRendimento>, formulario: FormData) {
  const esquema = z.object({
    valor,
    percentual: z.coerce.number({ error: "Informe o percentual do CDI." }).positive("Percentual deve ser maior que zero.").max(300, "Percentual máximo: 300%."),
    inicio: data,
    fim: data,
  });
  return executar(esquema, formulario, (e) => rendimentoRealCdi(e.valor, e.percentual, e.inicio, e.fim));
}
