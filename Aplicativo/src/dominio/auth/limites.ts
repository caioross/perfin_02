// Limites de senha compartilhados entre servidor (validação) e formulários (atributos HTML),
// sem levar o zod para o navegador.
export const SENHA_MINIMO = 8;
export const SENHA_MAXIMO = 72; // limite do bcrypt usado pelo Supabase Auth
export const DICA_SENHA = `Mínimo de ${SENHA_MINIMO} caracteres, com letras e números.`;
