// Retorno da função pública termometro_publico() do Supabase (somente últimos valores, sem histórico).

export type StatusMeta = "abaixo_do_piso" | "dentro_da_meta" | "acima_do_teto" | "sem_dados" | "meta_nao_cadastrada";

export type ItemTermometro = {
  codigo: string;
  nome: string;
  rotulo: string;
  valor: number | null;
  data_referencia: string | null;
};

export type MetaTermometro = {
  data_referencia: string | null;
  ipca_12m: number | null;
  ano: number | null;
  centro: number | null;
  piso: number | null;
  teto: number | null;
  status: StatusMeta;
};

export type Termometro = {
  atualizado_em: string | null;
  indicadores: ItemTermometro[];
  meta: MetaTermometro | null;
};
