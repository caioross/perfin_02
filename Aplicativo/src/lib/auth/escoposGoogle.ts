// Escopos pedidos no login Google (perfil usuário). openid/email/profile o Supabase já inclui.
// gmail.compose também permitiria enviar: o código só cria rascunhos (ver servicos/google/gmail.ts).
export const ESCOPOS_GOOGLE = [
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/gmail.compose",
] as const;
