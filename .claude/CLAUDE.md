# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão geral

Projeto Perfin (finanças pessoais), dividido em três frentes independentes:

- `Aplicativo/` — código do aplicativo
- `Website/` — site institucional / landing page
- `Documentacao/` — documentação do produto, requisitos e decisões

Regras de negócio: `Documentacao/regras-de-negocio.md`. Decisões: `Documentacao/decisoes/`. Configuração/publicação: `Documentacao/configuracao.md`.

## Stack e comandos

- `Aplicativo/` — Portal Perfin: Next.js 16.4 (App Router, `cacheComponents` + `partialPrefetching`, `proxy.ts` em vez de middleware), TypeScript, Tailwind 4, Supabase, PWA. Publicado na Vercel (Root Directory `Aplicativo`); nunca dependa de localhost — URLs públicas vêm de `NEXT_PUBLIC_SITE_URL`.
  - `npm run lint` · `npm run typecheck` · `npm test` · `npm run build`
  - Teste isolado: `npx vitest run src/dominio/insights/insights.test.ts`
  - Antes de usar APIs do Next, leia `Aplicativo/node_modules/next/dist/docs/` (versão com mudanças incompatíveis).
- `Website/` — site institucional (Next.js, mesmo padrão; lê só a função pública `termometro_publico`).
- `Aplicativo/supabase/` — `migrations/*.sql` (fonte da verdade do banco), `scripts/aplicar_migrations.py`, `scripts/criar_admin.py`, `scripts/definir_senha_coletor.py`, `testes/testar_banco.py` (cálculos × valores oficiais e RLS). Requer `DATABASE_URL` e `SUPABASE_POOLER_HOST` (conexão direta é só IPv6).
- `Aplicativo/coletor/` — coletor Python do BCB/SGS; roda em `.github/workflows/coletar-indicadores.yml`.
- CI: `.github/workflows/ci.yml` valida toda PR (jobs `portal`, `site`, `python`, `banco` com Supabase local via CLI, `segredos`). Testes do coletor: `python -m unittest discover -s Aplicativo/coletor -p "test_*.py"`.
- No Windows PowerShell 5.1, não reescreva arquivos UTF-8 com `Get-Content`/`Set-Content` (corrompe acentos); use as ferramentas de edição ou Python.

## Arquitetura do Portal (`Aplicativo/src`)

- `app/` — rotas finas; páginas leem sessão/`searchParams` dentro de `<Suspense>`; Server Actions em `acoes.ts`.
- `dominio/` — regras puras (filtros, insights, montagem de relatório/MIME/contexto do assistente).
- `servicos/` — Supabase (sessão do usuário + RLS; `admin.ts` com secret key só para `google_tokens`), Google via `fetch`, Gemini.
- `lib/` — sessão (`exigirAcesso`/`verificarAcesso`, `destinoAposLogin`), env, cripto, formatação, erros.
- Autenticação: login/cadastro por e-mail e Google só no Portal (`/login`, `/cadastro`, `/esqueci-senha`, `/redefinir-senha`, `/auth/confirmar`, `/auth/callback`); regras de entrada em `dominio/auth/`.
- `componentes/` — UI por props; `tipos/` — tipos compartilhados.
- Cálculos financeiros ficam em funções SQL (`numeric`); a UI só formata.

## Convenções

- Idioma: português do Brasil em textos, commits e documentação.

## Configuração do Claude

Estrutura em `.claude/` (genérica; especializar quando a stack for definida):

- `rules/` — regras permanentes do projeto:
  - `geral.md` — idioma, segredos, escopo das mudanças.
  - `architecture.md` — preservar arquitetura, reuso, dependências, limites de tamanho (arquivos ≤ 400 linhas, funções ≤ 50).
  - `seguranca.md` — proibições (segredos, RLS, autenticação, logs) e validações obrigatórias em auth.
  - `react-nextjs.md` — componentes, Server/Client Components, estado, TypeScript, segurança no cliente, acessibilidade.
- `agents/` — subagents especialistas que trabalham isoladamente:
  - `architect` — analisa requisitos e arquitetura; nunca altera código.
  - `frontend` — implementa interfaces React/Next.js seguindo padrões existentes.
  - `tester` — cria testes (edge cases, regressões, erros de estado).
  - `reviewer` — code review rigoroso; não altera arquivos.
- `skills/` — processos reutilizáveis:
  - `nova-funcionalidade` — fluxo architect → implementação → tester → reviewer.
- `hooks/` + `settings.json` — ações obrigatórias em eventos:
  - `proteger-arquivos.ps1` (PreToolUse em Edit/Write) — bloqueia edição de `.env*`, `.pem`, `.key`, `.pfx`, `.p12`.


