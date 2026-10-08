import { z } from "zod";
import { SENHA_MAXIMO, SENHA_MINIMO } from "./limites";

// Regras de entrada das telas de autenticação (regras-de-negocio.md §1).
// Validadas no servidor; os atributos HTML dos campos só melhoram a experiência.

export const esquemaEmail = z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(200);

export const esquemaSenhaNova = z
  .string()
  .min(SENHA_MINIMO, `A senha precisa ter pelo menos ${SENHA_MINIMO} caracteres.`)
  .max(SENHA_MAXIMO, `A senha pode ter no máximo ${SENHA_MAXIMO} caracteres.`)
  .regex(/\p{L}/u, "A senha precisa ter pelo menos uma letra.")
  .regex(/\d/, "A senha precisa ter pelo menos um número.")
  // O bcrypt do Supabase conta bytes: letras acentuadas ocupam 2.
  .refine((senha) => new TextEncoder().encode(senha).length <= SENHA_MAXIMO, "Senha longa demais. Use menos caracteres acentuados.");

const esquemaNome = z.string().trim().min(2, "Informe seu nome.").max(120, "Nome muito longo.");

const SENHAS_DIFERENTES = { message: "As senhas não conferem.", path: ["confirmacao"] };

export const esquemaLogin = z.object({
  email: esquemaEmail,
  senha: z.string().min(1).max(200),
});

export const esquemaCadastro = z
  .object({ nome: esquemaNome, email: esquemaEmail, senha: esquemaSenhaNova, confirmacao: z.string() })
  .refine((d) => d.senha === d.confirmacao, SENHAS_DIFERENTES);

export const esquemaRedefinicao = z
  .object({ senha: esquemaSenhaNova, confirmacao: z.string() })
  .refine((d) => d.senha === d.confirmacao, SENHAS_DIFERENTES);

// Primeira mensagem de erro, para exibir no formulário.
export function primeiraMensagem(erro: z.ZodError): string {
  return erro.issues[0]?.message ?? "Dados inválidos.";
}

// Lê os campos de um FormData como texto (campos ausentes viram string vazia).
export function lerCampos<T extends string>(formulario: FormData, nomes: readonly T[]): Record<T, string> {
  return Object.fromEntries(nomes.map((n) => [n, String(formulario.get(n) ?? "")])) as Record<T, string>;
}
