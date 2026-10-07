import { describe, expect, it } from "vitest";
import type { MetaInflacao, PontoInflacao, ResumoCambio, ResumoJuros } from "@/tipos/indicadores";
import { gerarInsights, ordenarInsights } from "./index";
import { regraAluguel, regraMesAcimaDoPadrao, regraMetaInflacao, regraTendenciaInflacao, sequenciaFinal } from "./regrasInflacao";
import { regraCdiVersusInflacao, regraJuroReal, regrasCambio, regrasDadosDesatualizados } from "./regrasMercado";
import type { DadosInsights } from "./tipos";

const meta = (ipca: number, status: MetaInflacao["status"]): MetaInflacao => ({
  data_referencia: "2026-09-01", ipca_12m: ipca, ano: 2026, centro: 3, piso: 1.5, teto: 4.5,
  distancia_centro: ipca - 3, status,
});

const juros = (real: number | null): ResumoJuros => ({
  selic_atual: 15, selic_data: "2026-09-18", cdi_periodo: 12, cdi_anualizado: 14.9,
  referencia_12m: "2026-09-01", cdi_12m: 14, ipca_12m: 5, juro_real_12m: real,
});

const serie = (valores12m: number[], mensais?: number[]): PontoInflacao[] =>
  valores12m.map((v, i) => ({
    indicador_codigo: "ipca", data_referencia: `2025-${String(i + 1).padStart(2, "0")}-01`,
    valor: mensais?.[i] ?? 0.4, acumulado_ano: null, acumulado_12m: v,
  }));

const moeda = (parcial: Partial<ResumoCambio>): ResumoCambio => ({
  indicador_codigo: "dolar", ultima_data: "2026-10-05", ultimo_valor: 5.4, variacao_periodo: 1, media: 5.3,
  minimo: 5.1, maximo: 5.6, volatilidade_anual: 10, variacao_mes: 1, variacao_ano: 2, variacao_12m: 3,
  minimo_12m: 5.0, maximo_12m: 6.0, ...parcial,
});

describe("regra de meta de inflação (C6)", () => {
  it("acima do teto é alerta com o excesso em p.p.", () => {
    const insight = regraMetaInflacao(meta(5.1, "acima_do_teto"));
    expect(insight?.severidade).toBe("alerta");
    expect(insight?.texto).toContain("0,60 p.p. acima do teto");
  });
  it("abaixo do piso é atenção", () => {
    expect(regraMetaInflacao(meta(1.2, "abaixo_do_piso"))?.severidade).toBe("atencao");
  });
  it("dentro da meta é informativo; sem dados não gera insight", () => {
    expect(regraMetaInflacao(meta(4.5, "dentro_da_meta"))?.severidade).toBe("informativo");
    expect(regraMetaInflacao(null)).toBeNull();
    expect(regraMetaInflacao({ ...meta(4, "sem_dados"), ipca_12m: null })).toBeNull();
  });
});

describe("tendência da inflação", () => {
  it("conta a sequência final de altas ou quedas", () => {
    expect(sequenciaFinal([1, 2, 3, 4])).toBe(3);
    expect(sequenciaFinal([5, 4, 3])).toBe(-2);
    expect(sequenciaFinal([1, 3, 2, 3])).toBe(1);
    expect(sequenciaFinal([2, 2, 2])).toBe(0);
  });
  it("exatamente 3 meses seguidos dispara; 2 não", () => {
    expect(regraTendenciaInflacao(serie([4, 4.1, 4.2, 4.3]))?.texto).toContain("acelera há 3 meses");
    expect(regraTendenciaInflacao(serie([4, 4, 4.1, 4.2]))).toBeNull();
    expect(regraTendenciaInflacao(serie([5, 4.8, 4.6, 4.4]))?.severidade).toBe("informativo");
  });
});

describe("IPCA do mês × média dos 12 anteriores", () => {
  it("precisa de 13 meses e compara com a média", () => {
    const mensais = [...Array(12).fill(0.3), 0.5];
    const pontos = serie(Array(13).fill(4), mensais);
    expect(regraMesAcimaDoPadrao(pontos)?.severidade).toBe("atencao");
    expect(regraMesAcimaDoPadrao(pontos.slice(1))).toBeNull();
  });
});

describe("juro real (C5)", () => {
  it.each([
    [5, "informativo"],
    [5.01, "atencao"],
    [0, "informativo"],
    [-0.01, "alerta"],
  ])("juro real %s → %s", (real, severidade) => {
    expect(regraJuroReal(juros(real))?.severidade).toBe(severidade);
  });
  it("sem dado não gera insight", () => {
    expect(regraJuroReal(juros(null))).toBeNull();
  });
});

describe("aluguel e CDI × inflação", () => {
  it("IGP-M negativo e abaixo do IPCA favorece o inquilino", () => {
    const insight = regraAluguel([
      { indicador_codigo: "igpm", acumulado_12m: -1.2 } as never,
      { indicador_codigo: "ipca", acumulado_12m: 4.8 } as never,
    ]);
    expect(insight?.texto).toContain("favorece o inquilino");
    expect(insight?.severidade).toBe("atencao");
  });
  it("perda real é alerta", () => {
    const insight = regraCdiVersusInflacao({
      inicio: "2025-10-01", fim: "2026-08-31", rendimento_nominal: 2, ipca_periodo: 3, rendimento_real: -0.97,
    });
    expect(insight?.severidade).toBe("alerta");
    expect(insight?.texto).toContain("perda real");
    expect(insight?.texto).toContain("De 10/2025 a 08/2026");
  });
});

describe("câmbio (C9)", () => {
  it("variação de exatamente 3% no mês já é destacada", () => {
    expect(regrasCambio([moeda({ variacao_mes: 3 })], [])[0]?.severidade).toBe("atencao");
    expect(regrasCambio([moeda({ variacao_mes: 2.99 })], [])).toHaveLength(0);
  });
  it("máxima de 12 meses e volatilidade acima de 1,2× a média", () => {
    const [insight] = regrasCambio([moeda({ ultimo_valor: 6.0, volatilidade_anual: 13 })], [moeda({ volatilidade_anual: 10 })]);
    expect(insight.texto).toContain("máxima de 12 meses");
    expect(insight.texto).toContain("volatilidade acima");
  });
});

describe("dados desatualizados", () => {
  it("gera alerta por indicador desatualizado", () => {
    const [insight] = regrasDadosDesatualizados([
      { indicador_codigo: "euro", nome: "Euro (PTAX venda)", tipo: "cambio", periodicidade: "diaria", ultima_data: "2026-09-20", desatualizado: true },
      { indicador_codigo: "ipca", nome: "IPCA", tipo: "inflacao", periodicidade: "mensal", ultima_data: "2026-09-01", desatualizado: false },
    ]);
    expect(insight.severidade).toBe("alerta");
    expect(insight.texto).toContain("20/09/2026");
  });
});

describe("gerarInsights", () => {
  const dados: DadosInsights = {
    meta: meta(5.1, "acima_do_teto"), serieIpca: [], inflacao: [], juros: juros(7), ciclo: null,
    cdiVersusInflacao: null, cambioPeriodo: [moeda({ variacao_mes: 4 })], cambio12m: [], situacao: [],
  };
  it("ordena por severidade e depois relevância", () => {
    const ordenados = gerarInsights(dados, ["ipca", "cdi", "selic", "dolar"]);
    expect(ordenados.map((i) => i.severidade)).toEqual(["alerta", "atencao", "atencao"]);
    expect(ordenados[1].id).toBe("juro-real"); // relevância 2 > câmbio 1
  });
  it("respeita os indicadores do filtro", () => {
    const soDolar = gerarInsights(dados, ["dolar"]);
    expect(soDolar.map((i) => i.id)).toEqual(["cambio-dolar"]);
  });
  it("ordenarInsights não altera o array original", () => {
    const lista = gerarInsights(dados, ["ipca", "dolar"]);
    const copia = [...lista];
    ordenarInsights(lista);
    expect(lista).toEqual(copia);
  });
});
