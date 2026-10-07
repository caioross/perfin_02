import { describe, expect, it } from "vitest";
import { montarMensagemMime, paraBase64Url } from "./montarMime";

const anexo = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 255]);
const mime = montarMensagemMime(
  {
    assunto: "Relatório de indicadores — 09/2026",
    corpoTexto: "Olá,\nDestaques: inflação acima do teto.",
    anexo: { nomeArquivo: "perfin-indicadores-09-2026.xlsx", tipoMime: "application/vnd.ms-excel", conteudo: anexo },
  },
  "fronteira-teste",
);

describe("montarMensagemMime", () => {
  it("não define destinatário (o usuário escolhe no Gmail)", () => {
    expect(mime).not.toMatch(/^(To|Cc|Bcc):/m);
  });

  it("codifica o assunto com acentos (RFC 2047)", () => {
    const assunto = mime.match(/^Subject: =\?UTF-8\?B\?(.+)\?=$/m)?.[1];
    expect(Buffer.from(assunto ?? "", "base64").toString("utf8")).toBe("Relatório de indicadores — 09/2026");
  });

  it("anexa o arquivo em base64 com o nome correto", () => {
    expect(mime).toContain('Content-Disposition: attachment; filename="perfin-indicadores-09-2026.xlsx"');
    const partes = mime.split("--fronteira-teste");
    const corpoAnexo = partes[2].split("\r\n\r\n")[1].replace(/\r\n/g, "").trim();
    expect(new Uint8Array(Buffer.from(corpoAnexo, "base64"))).toEqual(anexo);
  });

  it("corpo em UTF-8 base64 e fechamento do multipart", () => {
    expect(mime).toContain("Content-Type: text/plain; charset=UTF-8");
    expect(mime.trimEnd().endsWith("--fronteira-teste--")).toBe(true);
  });

  it("limpa caracteres perigosos do nome do arquivo", () => {
    const outro = montarMensagemMime(
      { assunto: "x", corpoTexto: "y", anexo: { nomeArquivo: 'a"b\r\nX-Hack: 1.xlsx', tipoMime: "t/t", conteudo: anexo } },
      "f",
    );
    expect(outro).not.toContain("X-Hack: 1");
  });

  it("paraBase64Url não usa + / =", () => {
    expect(paraBase64Url("??>>~~")).not.toMatch(/[+/=]/);
  });
});
