import "server-only";
import { chamarRpc } from "@/servicos/supabase/rpc";
import { criarClienteServidor } from "@/servicos/supabase/servidor";
import type { PerfilAdmin } from "@/tipos/auth";
import type { Indicador } from "@/tipos/indicadores";

// Área do admin. Sempre com a sessão do usuário: o RLS só permite estas operações ao admin
// (e só bloqueio/desbloqueio de usuários Google).

export type MetaCadastrada = { ano: number; centro: number; tolerancia: number; atualizado_em: string };

export type SaudeColeta = {
  indicador_codigo: string;
  nome: string;
  ativo: boolean;
  ultima_data: string | null;
  desatualizado: boolean;
  ultima_coleta: string | null;
  ultimo_status: "sucesso" | "falha" | null;
  ultimos_registros: number | null;
  ultimo_erro: string | null;
};

function falha(contexto: string, mensagem?: string): never {
  throw new Error(`${contexto}: ${mensagem ?? "erro desconhecido"}`);
}

export async function listarPerfis(): Promise<PerfilAdmin[]> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("perfis")
    .select("user_id, email, nome, provedor, papel, ultimo_acesso, criado_em")
    .order("criado_em", { ascending: false });
  if (error) falha("Falha ao listar perfis", error.message);
  return (data ?? []) as PerfilAdmin[];
}

// Retorna false se o RLS recusou (ex.: alvo não é usuário Google).
export async function definirBloqueio(userId: string, bloquear: boolean): Promise<boolean> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("perfis")
    .update({ papel: bloquear ? "bloqueado" : "usuario" })
    .eq("user_id", userId)
    .select("user_id");
  if (error) return false;
  return (data ?? []).length === 1;
}

export async function listarMetas(): Promise<MetaCadastrada[]> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("metas_inflacao")
    .select("ano, centro, tolerancia, atualizado_em")
    .order("ano", { ascending: false });
  if (error) falha("Falha ao listar metas", error.message);
  return (data ?? []) as MetaCadastrada[];
}

export async function salvarMeta(ano: number, centro: number, tolerancia: number, adminId: string): Promise<void> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("metas_inflacao").upsert({
    ano, centro, tolerancia, atualizado_por: adminId, atualizado_em: new Date().toISOString(),
  });
  if (error) falha("Falha ao salvar meta", error.message);
}

export async function listarCatalogo(): Promise<Indicador[]> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.from("indicadores").select("*").order("ordem");
  if (error) falha("Falha ao listar catálogo", error.message);
  return (data ?? []) as Indicador[];
}

export async function definirAtivo(codigo: string, ativo: boolean): Promise<void> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("indicadores").update({ ativo }).eq("codigo", codigo);
  if (error) falha("Falha ao alterar indicador", error.message);
}

export async function obterSaudeColeta(): Promise<SaudeColeta[]> {
  return chamarRpc<SaudeColeta>(await criarClienteServidor(), "saude_coleta");
}
