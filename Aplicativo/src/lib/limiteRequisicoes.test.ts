import { describe, expect, it } from "vitest";
import { permitirRequisicao } from "./limiteRequisicoes";

describe("permitirRequisicao", () => {
  it("bloqueia depois do máximo e libera na janela seguinte", () => {
    const chave = `teste-${Math.random()}`;
    const t0 = 1_000_000;
    expect(permitirRequisicao(chave, 2, 1000, t0)).toBe(true);
    expect(permitirRequisicao(chave, 2, 1000, t0 + 10)).toBe(true);
    expect(permitirRequisicao(chave, 2, 1000, t0 + 20)).toBe(false);
    expect(permitirRequisicao(chave, 2, 1000, t0 + 1000)).toBe(true);
  });

  it("chaves diferentes não interferem", () => {
    expect(permitirRequisicao(`a-${Math.random()}`, 1, 1000)).toBe(true);
    expect(permitirRequisicao(`b-${Math.random()}`, 1, 1000)).toBe(true);
  });
});
