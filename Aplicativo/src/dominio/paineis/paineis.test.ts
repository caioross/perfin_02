import { describe, expect, it } from "vitest";
import { pivotarSerieDiaria } from "./cambio";
import { pivotarInflacao } from "./inflacao";

describe("pivotarInflacao", () => {
  const linhas = pivotarInflacao(
    [
      { indicador_codigo: "igpm", data_referencia: "2026-02-01", valor: 0.5, acumulado_ano: 1, acumulado_12m: 6.54, },
      { indicador_codigo: "ipca", data_referencia: "2026-02-01", valor: 0.3, acumulado_ano: 0.8, acumulado_12m: 4.83 },
      { indicador_codigo: "ipca", data_referencia: "2026-01-01", valor: 0.5, acumulado_ano: 0.5, acumulado_12m: 4.9 },
    ],
    [{ ano: 2026, piso: 1.5, teto: 4.5 }],
  );

  it("agrupa por mês em ordem crescente com a faixa da meta do ano", () => {
    expect(linhas.map((l) => l.mes)).toEqual(["2026-01-01", "2026-02-01"]);
    expect(linhas[1]).toMatchObject({ ipca: 0.3, igpm: 0.5, ipca_ano: 0.8, piso: 1.5, teto: 4.5 });
  });

  it("spread IGP-M − IPCA só existe quando os dois 12m existem", () => {
    expect(linhas[1].spread_igpm_ipca).toBe(1.71);
    expect(linhas[0].spread_igpm_ipca).toBeNull();
  });
});

describe("pivotarSerieDiaria", () => {
  it("coloca cada moeda e sua média móvel em colunas", () => {
    const linhas = pivotarSerieDiaria([
      { indicador_codigo: "euro", data_referencia: "2026-10-02", valor: 6.2, media_movel_21: null },
      { indicador_codigo: "dolar", data_referencia: "2026-10-02", valor: 5.4, media_movel_21: 5.35 },
      { indicador_codigo: "dolar", data_referencia: "2026-10-01", valor: 5.38, media_movel_21: 5.34 },
    ]);
    expect(linhas).toEqual([
      { data: "2026-10-01", dolar: 5.38, dolar_mm21: 5.34 },
      { data: "2026-10-02", dolar: 5.4, dolar_mm21: 5.35, euro: 6.2, euro_mm21: null },
    ]);
  });
});
