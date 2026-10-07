export type ItemResumoOffline = { rotulo: string; valor: number | null; formato: "percentual" | "cotacao" };

export type ResumoOffline = {
  gerado_em: string;
  itens: ItemResumoOffline[];
  destaques: string[];
};
