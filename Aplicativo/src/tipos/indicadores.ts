// Tipos espelhando o retorno das funções SQL (supabase/migrations). Datas em "AAAA-MM-DD".
// Valores numéricos chegam prontos do banco; a interface só formata.

export type CodigoInflacao = "ipca" | "igpm" | "inpc";
export type CodigoCambio = "dolar" | "euro";
export type CodigoIndicador = CodigoInflacao | "selic" | "cdi" | CodigoCambio;

export type Indicador = {
  codigo: CodigoIndicador;
  nome: string;
  unidade: string;
  tipo: "inflacao" | "juros" | "cambio";
  periodicidade: "mensal" | "diaria";
  serie_sgs: number;
  casas_decimais: number;
  ordem: number;
  ativo: boolean;
};

export type ResumoInflacao = {
  indicador_codigo: CodigoInflacao;
  ultima_data: string | null;
  valor_mes: number | null;
  acumulado_ano: number | null;
  acumulado_12m: number | null;
  acumulado_periodo: number | null;
  periodo_ate: string | null;
};

export type PontoInflacao = {
  indicador_codigo: CodigoInflacao;
  data_referencia: string;
  valor: number;
  acumulado_ano: number | null;
  acumulado_12m: number | null;
};

export type StatusMeta = "abaixo_do_piso" | "dentro_da_meta" | "acima_do_teto" | "sem_dados" | "meta_nao_cadastrada";

export type MetaInflacao = {
  data_referencia: string;
  ipca_12m: number | null;
  ano: number | null;
  centro: number | null;
  piso: number | null;
  teto: number | null;
  distancia_centro: number | null;
  status: StatusMeta;
};

export type ResumoJuros = {
  selic_atual: number | null;
  selic_data: string | null;
  cdi_periodo: number | null;
  cdi_anualizado: number | null;
  referencia_12m: string | null;
  cdi_12m: number | null;
  ipca_12m: number | null;
  juro_real_12m: number | null;
};

export type DecisaoSelic = {
  data_referencia: string;
  anterior: number;
  novo: number;
  variacao_pp: number;
};

export type CicloSelic = {
  selic_atual: number | null;
  direcao: "alta" | "queda" | "manutencao";
  decisoes_seguidas: number;
  ultima_decisao: string | null;
  ultima_variacao_pp: number | null;
};

export type PontoJurosMensal = {
  mes: string;
  selic: number | null;
  cdi_mes: number | null;
  ipca_mes: number | null;
  cdi_indice: number | null;
  ipca_indice: number | null;
  cdi_12m: number | null;
  ipca_12m: number | null;
  juro_real_12m: number | null;
};

export type ResumoCambio = {
  indicador_codigo: CodigoCambio;
  ultima_data: string;
  ultimo_valor: number;
  variacao_periodo: number | null;
  media: number | null;
  minimo: number | null;
  maximo: number | null;
  volatilidade_anual: number | null;
  variacao_mes: number | null;
  variacao_ano: number | null;
  variacao_12m: number | null;
  minimo_12m: number | null;
  maximo_12m: number | null;
};

export type PontoDiario = {
  indicador_codigo: CodigoIndicador;
  data_referencia: string;
  valor: number;
  media_movel_21: number | null;
};

export type SituacaoIndicador = {
  indicador_codigo: CodigoIndicador;
  nome: string;
  tipo: Indicador["tipo"];
  periodicidade: Indicador["periodicidade"];
  ultima_data: string | null;
  desatualizado: boolean;
};

export type Periodo = { inicio: string; fim: string };
