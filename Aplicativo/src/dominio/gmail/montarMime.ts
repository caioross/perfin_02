// Monta a mensagem MIME (RFC 2822/2045) do rascunho com anexo, codificada em base64url
// como a API do Gmail exige. Sem destinatário: o usuário escolhe no Gmail antes de enviar.

export type AnexoMime = {
  nomeArquivo: string;
  tipoMime: string;
  conteudo: Uint8Array;
};

export type MensagemRascunho = {
  assunto: string;
  corpoTexto: string;
  anexo: AnexoMime;
};

function base64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

// Quebra base64 em linhas de 76 caracteres (limite do RFC 2045).
function quebrarLinhas(texto: string): string {
  return texto.match(/.{1,76}/g)?.join("\r\n") ?? "";
}

// Cabeçalho com acentos: encoded-word RFC 2047.
function codificarCabecalho(texto: string): string {
  return `=?UTF-8?B?${Buffer.from(texto, "utf8").toString("base64")}?=`;
}

function nomeArquivoSeguro(nome: string): string {
  return nome.replace(/[^\w.\- ]/g, "_");
}

export function montarMensagemMime(mensagem: MensagemRascunho, fronteira: string): string {
  const nome = nomeArquivoSeguro(mensagem.anexo.nomeArquivo);
  const linhas = [
    "MIME-Version: 1.0",
    `Subject: ${codificarCabecalho(mensagem.assunto)}`,
    `Content-Type: multipart/mixed; boundary="${fronteira}"`,
    "",
    `--${fronteira}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    quebrarLinhas(base64(new TextEncoder().encode(mensagem.corpoTexto))),
    "",
    `--${fronteira}`,
    `Content-Type: ${mensagem.anexo.tipoMime}; name="${nome}"`,
    `Content-Disposition: attachment; filename="${nome}"`,
    "Content-Transfer-Encoding: base64",
    "",
    quebrarLinhas(base64(mensagem.anexo.conteudo)),
    "",
    `--${fronteira}--`,
    "",
  ];
  return linhas.join("\r\n");
}

export function paraBase64Url(texto: string): string {
  return Buffer.from(texto, "utf8").toString("base64url");
}
