import { describe, expect, it } from "vitest";
import { podeAlternarBloqueio, rotuloProvedor } from "./usuarios";

describe("podeAlternarBloqueio", () => {
  it.each([
    ["google", "usuario", true],
    ["email", "bloqueado", true],
    ["email", "admin", false],
    ["email", "sem_acesso", false],
    ["github", "usuario", false],
  ] as const)("%s/%s → %s", (provedor, papel, esperado) => {
    expect(podeAlternarBloqueio({ provedor, papel })).toBe(esperado);
  });
});

describe("rotuloProvedor", () => {
  it("rotula provedores conhecidos e não confunde outros com e-mail", () => {
    expect(rotuloProvedor("google")).toBe("Google");
    expect(rotuloProvedor("email")).toBe("E-mail e senha");
    expect(rotuloProvedor("github")).toBe("Outro");
    expect(rotuloProvedor("__proto__")).toBe("Outro");
  });
});
