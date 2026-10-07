// Erros da aplicação. Mensagens exibidas ao usuário são genéricas; detalhes vão só para o log
// do servidor, sem tokens nem dados sensíveis.

export class ErroValidacao extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroValidacao";
  }
}

// O Google recusou o refresh token (ex.: expirou após 7 dias no modo Teste): é preciso reconectar.
export class ErroReconexaoGoogle extends Error {
  constructor() {
    super("Sua conexão com o Google expirou. Entre novamente com o Google.");
    this.name = "ErroReconexaoGoogle";
  }
}

export const MENSAGEM_ERRO_GENERICA = "Não foi possível concluir a operação. Tente novamente em instantes.";

export function registrarErro(contexto: string, erro: unknown): void {
  const descricao = erro instanceof Error ? `${erro.name}: ${erro.message}` : "erro desconhecido";
  console.error(`[perfin] ${contexto}: ${descricao}`);
}

// Mensagem segura para a interface: só repassa erros de validação e de reconexão.
export function mensagemParaUsuario(erro: unknown): string {
  if (erro instanceof ErroValidacao || erro instanceof ErroReconexaoGoogle) {
    return erro.message;
  }
  return MENSAGEM_ERRO_GENERICA;
}
