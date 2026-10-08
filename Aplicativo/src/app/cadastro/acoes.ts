"use server";

import { redirect } from "next/navigation";
import { MUITAS_TENTATIVAS, SENHA_FRACA } from "@/dominio/auth/mensagens";
import { esquemaCadastro, esquemaEmail, lerCampos, primeiraMensagem } from "@/dominio/auth/validacao";
import { destinoAposLogin } from "@/lib/auth/destino";
import { MENSAGEM_ERRO_GENERICA, registrarErro } from "@/lib/erros";
import { permitirRequisicao } from "@/lib/limiteRequisicoes";
import { urlDoSite } from "@/lib/url";
import { criarClienteServidor } from "@/servicos/supabase/servidor";

// `nome`/`email` voltam ao formulário em caso de erro (o React limpa os campos após o envio).
export type EstadoCadastro = { erro: string | null; emailEnviado: string | null; nome: string; email: string };
export type EstadoReenvio = { mensagem: string | null };

const HORA_MS = 60 * 60 * 1000;

// Cadastro por e-mail e senha. A conta nasce "usuario" (gatilho do banco), mas só entra depois de
// confirmar o e-mail. E-mail já cadastrado recebe a mesma resposta, para não revelar contas.
export async function cadastrar(_estado: EstadoCadastro, formulario: FormData): Promise<EstadoCadastro> {
  const campos = lerCampos(formulario, ["nome", "email", "senha", "confirmacao"] as const);
  const falha = (erro: string): EstadoCadastro => ({ erro, emailEnviado: null, nome: campos.nome, email: campos.email });
  const entrada = esquemaCadastro.safeParse(campos);
  if (!entrada.success) return falha(primeiraMensagem(entrada.error));
  const { nome, email, senha } = entrada.data;
  if (!permitirRequisicao(`cadastro:${email}`, 3, HORA_MS)) return falha(MUITAS_TENTATIVAS);

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { emailRedirectTo: urlDoSite("/auth/confirmar"), data: { full_name: nome } },
  });
  if (error?.code === "weak_password") return falha(SENHA_FRACA);
  if (error && error.code !== "user_already_exists") {
    registrarErro("cadastro", error);
    return falha(MENSAGEM_ERRO_GENERICA);
  }
  // Sem confirmação de e-mail no Supabase, a sessão já vem pronta.
  if (data.session && data.user) redirect(await destinoAposLogin(supabase, data.user.id));
  return { erro: null, emailEnviado: email, nome, email };
}

// Reenvia o link de confirmação. Resposta sempre igual (não revela se a conta existe).
export async function reenviarConfirmacao(_estado: EstadoReenvio, formulario: FormData): Promise<EstadoReenvio> {
  const resposta = { mensagem: "Se o cadastro estiver pendente, enviamos um novo link. Confira também o spam." };
  const email = esquemaEmail.safeParse(formulario.get("email"));
  if (!email.success) return resposta;
  if (!permitirRequisicao(`reenvio:${email.data}`, 3, HORA_MS)) return { mensagem: MUITAS_TENTATIVAS };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.data,
    options: { emailRedirectTo: urlDoSite("/auth/confirmar") },
  });
  if (error) registrarErro("reenviar confirmação", error);
  return resposta;
}
