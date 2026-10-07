import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { cifrar, decifrar } from "./cripto";

const CHAVE = randomBytes(32).toString("base64");

describe("cripto (AES-256-GCM)", () => {
  it("ida e volta recupera o texto", () => {
    const cifrado = cifrar("1//token-de-teste", CHAVE);
    expect(cifrado.startsWith("v1.")).toBe(true);
    expect(cifrado).not.toContain("token-de-teste");
    expect(decifrar(cifrado, CHAVE)).toBe("1//token-de-teste");
  });

  it("cada cifragem usa IV diferente", () => {
    expect(cifrar("mesmo", CHAVE)).not.toBe(cifrar("mesmo", CHAVE));
  });

  it("detecta adulteração", () => {
    const [v, iv, tag, dados] = cifrar("segredo", CHAVE).split(".");
    const adulterado = [v, iv, tag, `${dados.slice(0, -2)}AA`].join(".");
    expect(() => decifrar(adulterado, CHAVE)).toThrow();
  });

  it("recusa chave errada ou de tamanho inválido", () => {
    const cifrado = cifrar("segredo", CHAVE);
    expect(() => decifrar(cifrado, randomBytes(32).toString("base64"))).toThrow();
    expect(() => cifrar("x", randomBytes(16).toString("base64"))).toThrow(/32 bytes/);
  });

  it("recusa formato inválido", () => {
    expect(() => decifrar("texto-qualquer", CHAVE)).toThrow(/Formato/);
  });
});
