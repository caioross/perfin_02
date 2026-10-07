export type EventoAgenda = {
  id: string;
  titulo: string;
  inicio: string;
  fim: string | null;
  diaInteiro: boolean;
  local: string | null;
  linkReuniao: string | null;
  linkEvento: string | null;
};

export type CelulaPlanilha = string | number | null;

export type AbaPlanilha = {
  titulo: string;
  linhas: CelulaPlanilha[][];
};

export type ConteudoPlanilha = {
  titulo: string;
  abas: AbaPlanilha[];
};

export type Relatorio = {
  id: string;
  mes_referencia: string;
  drive_file_id: string;
  drive_url: string;
  rascunho_gmail_id: string | null;
  criado_em: string;
};
