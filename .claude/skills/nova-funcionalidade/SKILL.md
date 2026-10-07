---
name: nova-funcionalidade
description: Processo padrão para implementar uma nova funcionalidade ou mudança no Perfin, passando pelos subagents architect, frontend, tester e reviewer. Use quando o usuário pedir uma nova feature ou mudança relevante.
---

# Nova funcionalidade

Siga as etapas em ordem. Não pule etapas sem avisar o usuário.

1. **Análise** — acione o subagent `architect` com o pedido. Apresente ao usuário o impacto, arquivos envolvidos, riscos e plano. Aguarde aprovação antes de seguir.
2. **Implementação** — para interfaces, acione o subagent `frontend` com o plano aprovado. Para outras partes, implemente seguindo o plano.
3. **Testes** — acione o subagent `tester` informando os arquivos alterados.
4. **Revisão** — acione o subagent `reviewer` com os arquivos alterados e de teste.
5. **Correções** — corrija os problemas apontados pelo `tester` e pelo `reviewer` e repita as etapas 3 e 4 se a correção for relevante.
6. **Resumo** — informe ao usuário o que foi feito, o resultado dos testes e pendências.
