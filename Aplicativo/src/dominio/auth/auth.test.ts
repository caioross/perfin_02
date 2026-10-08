import { describe, expect, it } from "vitest";
import { autenticouPorRecuperacao, rotaAposLogin, tipoLinkEmail } from "./rotas";
import { esquemaCadastro, esquemaLogin, esquemaRedefinicao, lerCampos, primeiraMensagem } from "./validacao";

const CADASTRO_VALIDO = { nome: "Ana Lima", email: " Ana@Exemplo.com ", senha: "segura123", confirmacao: "segura123" };

describe("esquemaCadastro", () => {
  it("aceita dados válidos e normaliza o e-mail", () => {
    const r = esquemaCadastro.safeParse(CADASTRO_VALIDO);
    expect(r.success && r.data.email).toBe("ana@exemplo.com");
  });

  it.each([
    [{ senha: "curta1", confirmacao: "curta1" }, "pelo menos 8"],
    [{ senha: "somenteletras", confirmacao: "somenteletras" }, "número"],
    [{ senha: "12345678", confirmacao: "12345678" }, "letra"],
    [{ senha: "a1".repeat(37), confirmacao: "a1".repeat(37) }, "no máximo 72"],
    [{ confirmacao: "outra123" }, "não conferem"],
    [{ email: "sem-arroba" }, "e-mail válido"],
    [{ nome: " " }, "Informe seu nome"],
  ])("recusa %o", (alteracao, trecho) => {
    const r = esquemaCadastro.safeParse({ ...CADASTRO_VALIDO, ...alteracao });
    expect(r.success).toBe(false);
    if (!r.success) expect(primeiraMensagem(r.error)).toContain(trecho);
  });

  it("aceita letras acentuadas na senha", () => {
    expect(esquemaCadastro.safeParse({ ...CADASTRO_VALIDO, senha: "ação2026", confirmacao: "ação2026" }).success).toBe(true);
  });
});

describe("esquemaLogin e esquemaRedefinicao", () => {
  it("login não aplica regra de força (senhas antigas continuam entrando)", () => {
    expect(esquemaLogin.safeParse({ email: "a@b.com", senha: "x" }).success).toBe(true);
    expect(esquemaLogin.safeParse({ email: "a@b.com", senha: "" }).success).toBe(false);
  });

  it("redefinição exige senha forte e confirmação igual", () => {
    expect(esquemaRedefinicao.safeParse({ senha: "nova12345", confirmacao: "nova12345" }).success).toBe(true);
    expect(esquemaRedefinicao.safeParse({ senha: "nova12345", confirmacao: "nova1234" }).success).toBe(false);
  });
});

describe("lerCampos", () => {
  it("converte ausentes em string vazia", () => {
    const f = new FormData();
    f.set("email", "a@b.com");
    expect(lerCampos(f, ["email", "senha"] as const)).toEqual({ email: "a@b.com", senha: "" });
  });
});

describe("rotaAposLogin", () => {
  it.each([
    ["admin", "/login/mfa"],
    ["usuario", "/visao-geral"],
    ["bloqueado", "/nao-autorizado"],
    ["sem_acesso", "/nao-autorizado"],
    [null, "/nao-autorizado"],
    [undefined, "/nao-autorizado"],
  ] as const)("%s → %s", (papel, rota) => {
    expect(rotaAposLogin(papel)).toBe(rota);
  });
});

describe("tipoLinkEmail", () => {
  it("aceita só os tipos tratados", () => {
    expect(tipoLinkEmail("recovery")).toBe("recovery");
    expect(tipoLinkEmail("email")).toBe("email");
    expect(tipoLinkEmail("magiclink")).toBeNull();
    expect(tipoLinkEmail(null)).toBeNull();
  });
});

describe("autenticouPorRecuperacao", () => {
  it("só aceita sessão com método recovery", () => {
    expect(autenticouPorRecuperacao([{ method: "recovery", timestamp: 1 }])).toBe(true);
    expect(autenticouPorRecuperacao([{ method: "password", timestamp: 1 }])).toBe(false);
    expect(autenticouPorRecuperacao(undefined)).toBe(false);
    expect(autenticouPorRecuperacao(["recovery"])).toBe(false);
  });
});

describe("senha em bytes", () => {
  it("recusa senha acentuada acima de 72 bytes", () => {
    const senha = "ç".repeat(40) + "1";
    expect(esquemaRedefinicao.safeParse({ senha, confirmacao: senha }).success).toBe(false);
  });
});
