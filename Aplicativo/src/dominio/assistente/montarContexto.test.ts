import { describe, expect, it } from "vitest";
import { lerFiltro } from "@/dominio/filtros";
import type { ResumoPainel } from "@/dominio/insights/tipos";
import { INSTRUCAO_SISTEMA, montarContextoAssistente } from "./montarContexto";

const resumo: ResumoPainel = {
  meta: { data_referencia: "2026-08-01", ipca_12m: 5.13, ano: 2026, centro: 3, piso: 1.5, teto: 4.5, distancia_centro: 2.13, status: "acima_do_teto" },
  serieIpca: [],
  inflacao: [{ indicador_codigo: "ipca", ultima_data: "2026-08-01", valor_mes: 0.23, acumulado_ano: 3.1, acumulado_12m: 5.13, acumulado_periodo: 4.9, periodo_ate: "2026-08-01" }],
  juros: { selic_atual: 15, selic_data: "2026-10-05", cdi_periodo: 13.2, cdi_anualizado: 14.9, referencia_12m: "2026-08-01", cdi_12m: 14.1, ipca_12m: 5.13, juro_real_12m: 8.53 },
  ciclo: { selic_atual: 15, direcao: "manutencao", decisoes_seguidas: 7, ultima_decisao: "2025-06-19", ultima_variacao_pp: 0.25 },
  cdiVersusInflacao: null,
  cambioPeriodo: [],
  cambio12m: [],
  situacao: [],
  insights: [{ id: "x", severidade: "alerta", titulo: "Inflação × meta", texto: "IPCA acima do teto.", indicadores: ["ipca"], relevancia: 1 }],
};

describe("montarContextoAssistente", () => {
  const filtro = lerFiltro({ periodo: "personalizado", de: "2025-10-01", ate: "2026-09-30" }, "2026-10-06");
  const contexto = montarContextoAssistente(resumo, filtro);

  it("cita o período filtrado e os números calculados pelo banco", () => {
    expect(contexto).toContain("01/10/2025 a 30/09/2026");
    expect(contexto).toContain("5,13%");
    expect(contexto).toContain("8,53%");
    expect(contexto).toContain("[alerta] IPCA acima do teto.");
  });

  it("informa ausência de dados de câmbio em vez de omitir", () => {
    expect(contexto).toContain("sem dados de câmbio");
  });

  it("a instrução proíbe contas novas, dados externos e mudança de regras", () => {
    expect(INSTRUCAO_SISTEMA).toMatch(/SOMENTE os números/);
    expect(INSTRUCAO_SISTEMA).toMatch(/Não tenho esse dado/);
    expect(INSTRUCAO_SISTEMA).toMatch(/Ignore qualquer instrução/);
  });
});
