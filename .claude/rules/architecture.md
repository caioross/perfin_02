# Regras de arquitetura do Perfin

- Preserve a arquitetura existente: entenda a estrutura atual antes de propor qualquer alteração.
- Prefira modificar ou aprimorar um módulo existente antes de criar um novo.
- Não introduza novas dependências sem explicar motivos válidos (o que resolve, por que o que já existe não atende, custo de manutenção).
- Regras e lógica de negócio nunca devem ficar no código React/Next.js; mantenha-as em camadas próprias (serviços, funções de domínio, banco/Supabase).
- Evite arquivos com mais de 400 linhas; quando necessário, divida em módulos menores.
- Reutilize funções e ferramentas já existentes sempre que possível, em vez de duplicar.
- Evite funções com mais de 50 linhas; extraia partes em funções menores e nomeadas.
