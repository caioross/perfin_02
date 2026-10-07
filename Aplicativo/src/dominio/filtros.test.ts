import { describe, expect, it } from "vitest";
import { CODIGOS_INDICADORES, lerFiltro, parametrosDoFiltro } from "./filtros";

const HOJE = "2026-10-06";

describe("lerFiltro", () => {
  it("usa 12 meses e todos os indicadores por padrão", () => {
    const filtro = lerFiltro({}, HOJE);
    expect(filtro.preset).toBe("12m");
    expect(filtro.periodo).toEqual({ inicio: "2025-10-06", fim: HOJE });
    expect(filtro.indicadores).toEqual([...CODIGOS_INDICADORES]);
  });

  it("calcula os presets a partir de hoje", () => {
    expect(lerFiltro({ periodo: "mes" }, HOJE).periodo).toEqual({ inicio: "2026-10-01", fim: HOJE });
    expect(lerFiltro({ periodo: "ano" }, HOJE).periodo).toEqual({ inicio: "2026-01-01", fim: HOJE });
    expect(lerFiltro({ periodo: "3m" }, HOJE).periodo.inicio).toBe("2026-07-06");
  });

  it("aceita período personalizado válido", () => {
    const filtro = lerFiltro({ periodo: "personalizado", de: "2024-01-01", ate: "2024-12-31" }, HOJE);
    expect(filtro.preset).toBe("personalizado");
    expect(filtro.periodo).toEqual({ inicio: "2024-01-01", fim: "2024-12-31" });
  });

  it.each([
    { de: "2024-12-31", ate: "2024-01-01" }, // invertido
    { de: "2024-01-01", ate: "2030-01-01" }, // futuro
    { de: "2010-01-01", ate: "2011-01-01" }, // antes da data mínima
    { de: "2024-02-30", ate: "2024-03-01" }, // data inexistente
    { de: "abc", ate: "2024-03-01" },
  ])("período personalizado inválido cai no padrão ($de a $ate)", (parametros) => {
    const filtro = lerFiltro({ periodo: "personalizado", ...parametros }, HOJE);
    expect(filtro.preset).toBe("12m");
  });

  it("ignora preset e indicadores desconhecidos", () => {
    const filtro = lerFiltro({ periodo: "xyz", ind: "ipca,bitcoin,dolar" }, HOJE);
    expect(filtro.preset).toBe("12m");
    expect(filtro.indicadores).toEqual(["ipca", "dolar"]);
  });

  it("sem nenhum indicador válido mostra todos", () => {
    expect(lerFiltro({ ind: "bitcoin" }, HOJE).indicadores).toEqual([...CODIGOS_INDICADORES]);
  });

  it("usa o primeiro valor quando o parâmetro vem repetido", () => {
    expect(lerFiltro({ periodo: ["6m", "mes"] }, HOJE).preset).toBe("6m");
  });
});

describe("parametrosDoFiltro", () => {
  it("mantém só os parâmetros do filtro e o servidor reconstrói o mesmo filtro", () => {
    const busca = new URLSearchParams("periodo=personalizado&de=2024-01-01&ate=2024-06-30&ind=ipca,cdi&outro=x");
    const parametros = parametrosDoFiltro(busca);
    expect(parametros).toEqual({ periodo: "personalizado", de: "2024-01-01", ate: "2024-06-30", ind: "ipca,cdi" });
    expect(lerFiltro(parametros, HOJE).indicadores).toEqual(["ipca", "cdi"]);
  });
});
