// Agenda, relatório (Drive/Sheets) e rascunho no Gmail usam o token Google, que só é guardado
// para contas criadas pelo Google. Contas de e-mail/senha nunca recebem token, mesmo que o
// Supabase vincule um login Google depois — impede que quem pré-cadastrou um e-mail alheio
// passe a usar o Google da vítima.
export function usaRecursosGoogle(provedor: string): boolean {
  return provedor === "google";
}
