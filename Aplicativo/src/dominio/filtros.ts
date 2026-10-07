import { z } from "zod";
import type { CodigoIndicador, Periodo } from "@/tipos/indicadores";
import { dataValida, hojeEmSaoPaulo, inicioDoAno, inicioDoMes, somarMeses } from "./datas";

// Filtro global do Portal (Documentacao/regras-de-negocio.md §2): período + indicadores, na URL.

export const PRESETS_PERIODO = ["mes", "3m", "6m", "12m", "ano", "personalizado"] as const;
export type PresetPeriodo = (typeof PRESETS_PERIODO)[number];

export const ROTULOS_PERIODO: Record<PresetPeriodo, string> = {
  mes: "Mês atual",
  "3m": "3 meses",
  "6m": "6 meses",
  "12m": "12 meses",
  ano: "Ano atual",
  personalizado: "Personalizado",
};

export const CODIGOS_INDICADORES: readonly CodigoIndicador[] = ["ipca", "igpm", "inpc", "selic", "cdi", "dolar", "euro"];

export const DATA_MINIMA = "2015-01-01";
const PRESET_PADRAO = "12m" as const satisfies PresetPeriodo;

export type Filtro = {
  preset: PresetPeriodo;
  periodo: Periodo;
  indicadores: CodigoIndicador[];
};

const esquemaParametros = z.object({
  periodo: z.enum(PRESETS_PERIODO).catch(PRESET_PADRAO),
  de: z.string().optional().catch(undefined),
  ate: z.string().optional().catch(undefined),
  ind: z.string().optional().catch(undefined),
});

export type ParametrosBusca = Record<string, string | string[] | undefined>;

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export function periodoDoPreset(preset: Exclude<PresetPeriodo, "personalizado">, hoje: string): Periodo {
  const inicios: Record<typeof preset, string> = {
    mes: inicioDoMes(hoje),
    "3m": somarMeses(hoje, -3),
    "6m": somarMeses(hoje, -6),
    "12m": somarMeses(hoje, -12),
    ano: inicioDoAno(hoje),
  };
  return { inicio: inicios[preset], fim: hoje };
}

function periodoPersonalizado(de: string | undefined, ate: string | undefined, hoje: string): Periodo | null {
  if (!de || !ate || !dataValida(de) || !dataValida(ate)) return null;
  if (de > ate || ate > hoje || de < DATA_MINIMA) return null;
  return { inicio: de, fim: ate };
}

function indicadoresDaUrl(ind: string | undefined): CodigoIndicador[] {
  if (!ind) return [...CODIGOS_INDICADORES];
  const pedidos = new Set(ind.split(","));
  const validos = CODIGOS_INDICADORES.filter((codigo) => pedidos.has(codigo));
  return validos.length > 0 ? validos : [...CODIGOS_INDICADORES];
}

// Converte os parâmetros da URL em um filtro sempre válido (entrada inválida cai no padrão).
export function lerFiltro(parametros: ParametrosBusca, hoje: string = hojeEmSaoPaulo()): Filtro {
  const brutos = esquemaParametros.parse({
    periodo: primeiro(parametros.periodo),
    de: primeiro(parametros.de),
    ate: primeiro(parametros.ate),
    ind: primeiro(parametros.ind),
  });
  const indicadores = indicadoresDaUrl(brutos.ind);
  const preset: PresetPeriodo = brutos.periodo;
  if (preset === "personalizado") {
    const periodo = periodoPersonalizado(brutos.de, brutos.ate, hoje);
    if (periodo) return { preset, periodo, indicadores };
    return { preset: PRESET_PADRAO, periodo: periodoDoPreset(PRESET_PADRAO, hoje), indicadores };
  }
  return { preset, periodo: periodoDoPreset(preset, hoje), indicadores };
}

// Parâmetros da URL que formam o filtro (preservados ao navegar e enviados ao assistente).
export const PARAMETROS_FILTRO = ["periodo", "de", "ate", "ind"] as const;

// Extrai só os parâmetros do filtro de uma URL (o servidor valida com lerFiltro).
export function parametrosDoFiltro(busca: Pick<URLSearchParams, "get">): Record<string, string> {
  return Object.fromEntries(PARAMETROS_FILTRO.flatMap((nome) => {
    const valor = busca.get(nome);
    return valor ? [[nome, valor]] : [];
  }));
}

export function exibe(filtro: Filtro, codigo: CodigoIndicador): boolean {
  return filtro.indicadores.includes(codigo);
}
