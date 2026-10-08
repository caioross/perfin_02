export type Papel = "admin" | "usuario" | "sem_acesso" | "bloqueado";

export type PapelComAcesso = Extract<Papel, "admin" | "usuario">;

// Dados mínimos do usuário logado que circulam pela aplicação (nunca tokens).
export type UsuarioAtual = {
  id: string;
  email: string;
  nome: string | null;
  papel: PapelComAcesso;
  provedor: string; // provedor do cadastro: "google" ou "email"
};

export type PerfilAdmin = {
  user_id: string;
  email: string;
  nome: string | null;
  provedor: string;
  papel: Papel;
  ultimo_acesso: string | null;
  criado_em: string;
};
