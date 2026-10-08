## O que muda

<!-- Resumo curto e a issue relacionada (ex.: Closes #12). -->

## Como foi testado

- [ ] CI verde (portal, site, python, banco, segredos)
- [ ] Testes novos para o comportamento alterado

## Checklist

- [ ] Nenhum segredo no código ou na documentação (só variáveis de ambiente)
- [ ] RLS ligado em toda tabela nova; políticas testadas em `testar_banco.py`
- [ ] Migration nova é compatível com o código em produção (aplicada antes do merge)
- [ ] Regras de negócio/documentação atualizadas em `Documentacao/`
