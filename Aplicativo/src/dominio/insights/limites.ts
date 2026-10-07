// Limites das regras de insight (Documentacao/regras-de-negocio.md §5).
// Alterar aqui muda o comportamento em todo o Portal; documente a mudança.

/** Juro real 12m acima deste valor (% a.a.) indica política monetária restritiva. */
export const JURO_REAL_RESTRITIVO = 5;

/** Juro real 12m abaixo deste valor (% a.a.) é considerado negativo. */
export const JURO_REAL_NEGATIVO = 0;

/** Meses seguidos de alta/queda do IPCA 12m para caracterizar tendência. */
export const MESES_TENDENCIA = 3;

/** Meses anteriores usados na média mensal de comparação do IPCA do mês. */
export const MESES_MEDIA_MENSAL = 12;

/** Variação mensal do câmbio (em %, para mais ou para menos) que merece destaque. */
export const VARIACAO_CAMBIO_MES = 3;

/** Volatilidade do período acima deste múltiplo da volatilidade de 12 meses é destacada. */
export const MULTIPLO_VOLATILIDADE = 1.2;

/** Quantidade de insights exibidos na Visão geral. */
export const INSIGHTS_VISAO_GERAL = 5;
