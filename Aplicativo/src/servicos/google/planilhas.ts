import "server-only";
import type { CelulaPlanilha, ConteudoPlanilha } from "@/tipos/google";
import { requisicaoGoogle, requisicaoGoogleJson } from "./cliente";

const URL_SHEETS = "https://sheets.googleapis.com/v4/spreadsheets";
const URL_DRIVE = "https://www.googleapis.com/drive/v3/files";
export const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function celula(valor: CelulaPlanilha) {
  if (valor == null) return {};
  return typeof valor === "number"
    ? { userEnteredValue: { numberValue: valor } }
    : { userEnteredValue: { stringValue: valor } };
}

// Cria a Planilha Google (no Drive do usuário, escopo drive.file) em uma única chamada.
export async function criarPlanilha(
  accessToken: string,
  conteudo: ConteudoPlanilha,
): Promise<{ id: string; url: string }> {
  const corpo = {
    properties: { title: conteudo.titulo, locale: "pt_BR", timeZone: "America/Sao_Paulo" },
    sheets: conteudo.abas.map((aba, indice) => ({
      properties: { sheetId: indice, title: aba.titulo, gridProperties: { frozenRowCount: 1 } },
      data: [{ startRow: 0, startColumn: 0, rowData: aba.linhas.map((linha) => ({ values: linha.map(celula) })) }],
    })),
  };
  const criada = await requisicaoGoogleJson<{ spreadsheetId: string; spreadsheetUrl: string }>(accessToken, URL_SHEETS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  return { id: criada.spreadsheetId, url: criada.spreadsheetUrl };
}

const ID_ARQUIVO_VALIDO = /^[A-Za-z0-9_-]{10,200}$/;

// Exporta a planilha como .xlsx pelo Drive (só arquivos criados pelo app, escopo drive.file).
export async function exportarXlsx(accessToken: string, fileId: string): Promise<ArrayBuffer> {
  if (!ID_ARQUIVO_VALIDO.test(fileId)) throw new Error("Identificador de arquivo inválido.");
  const busca = new URLSearchParams({ mimeType: MIME_XLSX });
  const resposta = await requisicaoGoogle(accessToken, `${URL_DRIVE}/${fileId}/export?${busca}`);
  return resposta.arrayBuffer();
}
