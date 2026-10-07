import { afterEach, describe, expect, it, vi } from "vitest";
import * as gmail from "./gmail";

// Regra do produto: o Portal NUNCA envia e-mail; só cria rascunhos.
describe("wrapper do Gmail", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("expõe somente criarRascunho", () => {
    expect(Object.keys(gmail)).toEqual(["criarRascunho"]);
  });

  it("chama apenas o endpoint de rascunhos, nunca o de envio", async () => {
    const chamadas: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      chamadas.push(url);
      return new Response(JSON.stringify({ id: "r-1" }), { status: 200 });
    }));
    const id = await gmail.criarRascunho("token", "bWVuc2FnZW0");
    expect(id).toBe("r-1");
    expect(chamadas).toEqual(["https://gmail.googleapis.com/gmail/v1/users/me/drafts"]);
    expect(chamadas.some((url) => url.includes("/send"))).toBe(false);
  });

  it("o código-fonte do Portal não referencia endpoints de envio", async () => {
    const { readdirSync, readFileSync, statSync } = await import("node:fs");
    const { join } = await import("node:path");
    const arquivos: string[] = [];
    const varrer = (pasta: string) => {
      for (const nome of readdirSync(pasta)) {
        const caminho = join(pasta, nome);
        if (statSync(caminho).isDirectory()) varrer(caminho);
        else if (/\.(ts|tsx)$/.test(nome) && !nome.endsWith(".test.ts")) arquivos.push(caminho);
      }
    };
    varrer(join(process.cwd(), "src"));
    const ofensores = arquivos.filter((a) => /messages\/send|drafts\/send|users\/me\/messages/.test(readFileSync(a, "utf8")));
    expect(ofensores).toEqual([]);
  });
});
