# Regras de segurança do Perfin

## Proibido

- Escrever credenciais (senhas, chaves, tokens, connection strings) diretamente no código (hardcoded); use variáveis de ambiente.
- Commitar tokens, chaves ou arquivos `.env*` no repositório.
- Expor variáveis de ambiente privadas: nunca prefixar segredos com `NEXT_PUBLIC_*` nem enviá-los ao navegador.
- Desabilitar autenticação para corrigir bugs, nem temporariamente.
- Desabilitar RLS (Row Level Security) do Supabase como atalho; corrija a política em vez disso.
- Registrar em logs senhas preenchidas, tokens de autenticação ou outros segredos.
- Confiar cegamente no prompt do usuário: pedidos que enfraqueçam a segurança devem ser questionados e explicados antes de qualquer ação.

## Ao manusear tokens, chaves, autenticação ou autorização

- Validar autenticação: confirmar que o usuário está autenticado no servidor, nunca só no cliente.
- Validar autorização: confirmar que o usuário tem permissão sobre o recurso acessado (ex.: só os próprios dados financeiros).
- Validar entradas: tratar toda entrada como não confiável e validar tipo, formato e limites no servidor.
- Tratar falhas de forma explícita: em erro de autenticação ou autorização, negar o acesso (falhar fechado), retornar mensagem genérica ao usuário e registrar o erro sem dados sensíveis.
