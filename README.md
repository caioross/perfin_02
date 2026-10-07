# Perfin

Projeto de finanças pessoais.

Repositório: https://github.com/caioross/perfin_02

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `Aplicativo/` | Código do aplicativo |
| `Website/` | Site institucional / landing page |
| `Documentacao/` | Documentação do produto, requisitos e decisões |
| `.claude/` | Configuração do Claude Code (CLAUDE.md, agents, skills, rules, hooks) — versionada |

## Tecnologias

- [Next.js](https://nextjs.org) + TypeScript — Portal (`Aplicativo/`, PWA) e site (`Website/`), publicados na Vercel
- [Supabase](https://supabase.com) — banco de dados PostgreSQL, autenticação e API
- Google (Agenda, Drive/Sheets, Gmail) e Gemini — integrações do Portal
- Python — coletor de indicadores do Banco Central (GitHub Actions)

Documentação: [regras de negócio](Documentacao/regras-de-negocio.md) · [configuração e publicação](Documentacao/configuracao.md) · [decisões](Documentacao/decisoes/)

## Primeiros passos

1. Clone o repositório:

   ```bash
   git clone https://github.com/caioross/perfin_02.git
   ```

2. Crie um arquivo `.env` na raiz com as variáveis abaixo (peça os valores ao responsável pelo projeto). Os nomes completos de cada projeto estão em `Aplicativo/.env.example` e `Website/.env.example`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   SUPABASE_DB_PASSWORD=
   DATABASE_URL=
   SUPABASE_POOLER_HOST=
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   GEMINI_API_KEY=
   ADMIN_EMAIL=
   ADMIN_PASSWORD=
   ```

   O `.env` é ignorado pelo Git e nunca deve ser enviado ao repositório.

## Desenvolvimento com Claude Code

A pasta `.claude/` contém as instruções e automações do projeto para o Claude Code. Consulte [.claude/CLAUDE.md](.claude/CLAUDE.md) para detalhes.
