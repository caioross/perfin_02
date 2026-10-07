import "server-only";
import { randomUUID } from "node:crypto";
import { fimDoMes, hojeEmSaoPaulo, somarMeses } from "@/dominio/datas";
import { CODIGOS_INDICADORES } from "@/dominio/filtros";
import { montarMensagemMime, paraBase64Url } from "@/dominio/gmail/montarMime";
import { montarCorpoEmail, montarPlanilhaRelatorio, type DadosRelatorio } from "@/dominio/relatorio/montarPlanilha";
import { ErroValidacao, registrarErro } from "@/lib/erros";
import { formatarMesCurto } from "@/lib/formatacao";
import { criarRascunho } from "@/servicos/google/gmail";
import { criarPlanilha, exportarXlsx, MIME_XLSX } from "@/servicos/google/planilhas";
import { obterAccessToken } from "@/servicos/google/tokens";
import { obterResumoPainel } from "@/servicos/indicadores/resumo";
import { chamarRpc } from "@/servicos/supabase/rpc";
import { criarClienteServidor, type ClienteSupabase } from "@/servicos/supabase/servidor";
import type { UsuarioAtual } from "@/tipos/auth";
import type { Relatorio } from "@/tipos/google";
import type { DecisaoSelic, PontoInflacao, PontoJurosMensal, ResumoCambio } from "@/tipos/indicadores";

const MESES_SELECIONAVEIS = 24;

// Meses com IPCA publicado (o relatório usa sempre mês fechado), do mais recente ao mais antigo.
export async function listarMesesDisponiveis(): Promise<string[]> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("indicadores_valores")
    .select("data_referencia")
    .eq("indicador_codigo", "ipca")
    .order("data_referencia", { ascending: false })
    .limit(MESES_SELECIONAVEIS);
  if (error) throw new Error(`Falha ao listar meses: ${error.message}`);
  return (data ?? []).map((linha) => linha.data_referencia as string);
}

async function ultimaColeta(supabase: ClienteSupabase): Promise<string | null> {
  const { data } = await supabase
    .from("indicadores_valores")
    .select("coletado_em")
    .order("coletado_em", { ascending: false })
    .limit(1)
    .maybeSingle<{ coletado_em: string }>();
  return data?.coletado_em ?? null;
}

async function reunirDadosRelatorio(mesReferencia: string): Promise<DadosRelatorio> {
  const supabase = await criarClienteServidor();
  const hoje = hojeEmSaoPaulo();
  const fim = fimDoMes(mesReferencia) < hoje ? fimDoMes(mesReferencia) : hoje;
  const mes = { p_inicio: mesReferencia, p_fim: fim };
  const [resumo, serieInflacao12m, jurosMes, decisoesMes, cambioMes, coleta] = await Promise.all([
    obterResumoPainel(
      { preset: "personalizado", periodo: { inicio: mesReferencia, fim }, indicadores: [...CODIGOS_INDICADORES] },
      { incluirSituacao: false },
    ),
    chamarRpc<PontoInflacao>(supabase, "serie_inflacao", { p_inicio: somarMeses(mesReferencia, -11), p_fim: fim }),
    chamarRpc<PontoJurosMensal>(supabase, "serie_juros_mensal", mes),
    chamarRpc<DecisaoSelic>(supabase, "decisoes_selic", mes),
    chamarRpc<ResumoCambio>(supabase, "resumo_cambio", mes),
    ultimaColeta(supabase),
  ]);
  return { mesReferencia, resumo, serieInflacao12m, jurosMes: jurosMes[0] ?? null, decisoesMes, cambioMes, ultimaColeta: coleta };
}

export async function gerarRelatorio(usuario: UsuarioAtual, mesReferencia: string): Promise<Relatorio> {
  const meses = await listarMesesDisponiveis();
  if (!meses.includes(mesReferencia)) throw new ErroValidacao("Mês de referência inválido ou ainda sem IPCA publicado.");

  const dados = await reunirDadosRelatorio(mesReferencia);
  const accessToken = await obterAccessToken(usuario.id);
  const planilha = await criarPlanilha(accessToken, montarPlanilhaRelatorio(dados));

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("relatorios")
    .insert({ user_id: usuario.id, mes_referencia: mesReferencia, drive_file_id: planilha.id, drive_url: planilha.url })
    .select("id, mes_referencia, drive_file_id, drive_url, rascunho_gmail_id, criado_em")
    .single<Relatorio>();
  if (error || !data) throw new Error(`Falha ao registrar relatório: ${error?.message ?? ""}`);
  return data;
}

export async function listarRelatorios(): Promise<Relatorio[]> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("relatorios")
    .select("id, mes_referencia, drive_file_id, drive_url, rascunho_gmail_id, criado_em")
    .order("criado_em", { ascending: false })
    .limit(24);
  if (error) throw new Error(`Falha ao listar relatórios: ${error.message}`);
  return (data ?? []) as Relatorio[];
}

// O RLS garante que só o dono encontra o relatório; id de outro usuário retorna null.
async function buscarRelatorio(id: string): Promise<Relatorio | null> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("relatorios")
    .select("id, mes_referencia, drive_file_id, drive_url, rascunho_gmail_id, criado_em")
    .eq("id", id)
    .maybeSingle<Relatorio>();
  return data;
}

export function nomeArquivoXlsx(relatorio: Relatorio): string {
  return `perfin-indicadores-${formatarMesCurto(relatorio.mes_referencia).replace("/", "-")}.xlsx`;
}

export async function baixarXlsx(usuario: UsuarioAtual, id: string): Promise<{ nome: string; conteudo: ArrayBuffer } | null> {
  const relatorio = await buscarRelatorio(id);
  if (!relatorio) return null;
  const conteudo = await exportarXlsx(await obterAccessToken(usuario.id), relatorio.drive_file_id);
  return { nome: nomeArquivoXlsx(relatorio), conteudo };
}

// Cria um RASCUNHO no Gmail com o .xlsx anexado. Nunca envia.
export async function criarRascunhoRelatorio(usuario: UsuarioAtual, id: string): Promise<void> {
  const relatorio = await buscarRelatorio(id);
  if (!relatorio) throw new ErroValidacao("Relatório não encontrado.");
  const accessToken = await obterAccessToken(usuario.id);
  const [xlsx, dados] = await Promise.all([
    exportarXlsx(accessToken, relatorio.drive_file_id),
    reunirDadosRelatorio(relatorio.mes_referencia),
  ]);
  const mime = montarMensagemMime(
    {
      assunto: `Relatório de indicadores — ${formatarMesCurto(relatorio.mes_referencia)}`,
      corpoTexto: montarCorpoEmail(dados, relatorio.drive_url),
      anexo: { nomeArquivo: nomeArquivoXlsx(relatorio), tipoMime: MIME_XLSX, conteudo: new Uint8Array(xlsx) },
    },
    `perfin-${randomUUID()}`,
  );
  const rascunhoId = await criarRascunho(accessToken, paraBase64Url(mime));
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("relatorios").update({ rascunho_gmail_id: rascunhoId }).eq("id", id);
  // O rascunho já existe no Gmail; só registramos a falha de anotação (não é erro para o usuário).
  if (error) registrarErro("anotar rascunho", new Error(error.message));
}
