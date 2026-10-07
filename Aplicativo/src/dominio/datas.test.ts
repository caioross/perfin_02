import { describe, expect, it } from "vitest";
import { dataValida, fimDoMes, hojeEmSaoPaulo, inicioDoMes, somarMeses } from "./datas";

describe("datas", () => {
  it("somarMeses limita ao último dia do mês de destino", () => {
    expect(somarMeses("2026-01-31", 1)).toBe("2026-02-28");
    expect(somarMeses("2024-01-31", 1)).toBe("2024-02-29");
    expect(somarMeses("2026-03-15", -12)).toBe("2025-03-15");
    expect(somarMeses("2026-01-10", -1)).toBe("2025-12-10");
  });

  it("início e fim do mês", () => {
    expect(inicioDoMes("2026-10-06")).toBe("2026-10-01");
    expect(fimDoMes("2024-02-10")).toBe("2024-02-29");
    expect(fimDoMes("2026-12-01")).toBe("2026-12-31");
  });

  it("valida datas civis", () => {
    expect(dataValida("2024-02-29")).toBe(true);
    expect(dataValida("2025-02-29")).toBe(false);
    expect(dataValida("2025-13-01")).toBe(false);
    expect(dataValida("01/02/2025")).toBe(false);
  });

  it("hoje usa o fuso de São Paulo", () => {
    // 02:00 UTC de 7/out ainda é 6/out em São Paulo (UTC−3).
    expect(hojeEmSaoPaulo(new Date("2026-10-07T02:00:00Z"))).toBe("2026-10-06");
  });
});
