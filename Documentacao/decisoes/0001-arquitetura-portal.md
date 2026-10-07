# 0001 — Arquitetura do Portal Perfin

- **Data:** 2026-10-06
- **Status:** aceita

## Contexto

O time precisa de uma central de análise econômica publicada na Vercel e com dados no Supabase. Ela tem login Google, integrações com Google Workspace (Agenda, Drive/Sheets, Gmail), um assistente Gemini, um app instalável (PWA) e um site público.

## Decisões

1. **Três frentes no mesmo repositório:**
   - `Aplicativo/`: Portal em Next.js, projeto próprio na Vercel;
   - `Website/`: site em Next.js, outro projeto na Vercel;
   - `Aplicativo/coletor/`: coletor Python, rodando no GitHub Actions.
2. **Next.js 16.4 (App Router):**
   - `cacheComponents` e `partialPrefetching` ficam ligados, que é o padrão do scaffold. Por isso, toda leitura de sessão ou de `searchParams` fica dentro de `<Suspense>`.
   - `proxy.ts` (nome novo do middleware) faz só a checagem otimista de login. A autorização real é feita em cada página, ação e rota.
3. **Cálculos no banco.** Funções SQL com `numeric` são a fonte única dos números (regras C1–C13). TypeScript só formata e aplica regras de insight sobre números já calculados.
4. **Supabase Auth com dois provedores.** Google para usuários e e-mail/senha com MFA TOTP para o admin. O papel fica em `perfis`, criado por gatilho, e é fechado por padrão.
5. **Tokens Google:**
   - o `provider_refresh_token` é guardado cifrado (AES-256-GCM, `TOKEN_ENCRYPTION_KEY`) em `google_tokens`;
   - essa tabela não tem políticas para clientes e só o servidor a acessa, com `SUPABASE_SECRET_KEY`;
   - o access token é renovado a cada uso.
6. **APIs Google via `fetch`**, sem a dependência pesada `googleapis`. O Gmail expõe só `drafts.create`.
7. **Excel pelo Drive.** O .xlsx vem do `files.export` do Drive, sem biblioteca de planilha no projeto.
8. **PWA sem dependência.** Usa o `manifest.ts` nativo, um service worker manual (`public/sw.js`) e o `useOffline` do Next. `next-pwa` está sem manutenção e o Serwist acopla o build ao webpack.
9. **Coletor com privilégio mínimo.** O role Postgres `coletor_indicadores` só escreve em `indicadores_valores` e `coletas`. A conexão usa o pooler IPv4 (`aws-0-sa-east-1.pooler.supabase.com`), porque a conexão direta do Supabase é só IPv6 e o GitHub Actions não tem IPv6.
10. **Migrations sem CLI.** Os arquivos SQL versionados em `Aplicativo/supabase/migrations/` são aplicados por `supabase/scripts/aplicar_migrations.py`, que registra o que já rodou em `controle.migrations`. O MCP do Supabase desta máquina não tinha acesso ao projeto.

## Dependências adicionadas

| Pacote | Motivo |
|---|---|
| `@supabase/supabase-js`, `@supabase/ssr` | Sessão no servidor e cliente com RLS |
| `zod` | Validação de entrada no servidor |
| `recharts` | Gráficos (carregado com `next/dynamic`) |
| `@google/genai` | SDK oficial do Gemini (streaming) |
| `server-only` | Impede importar módulos de servidor no cliente |
| `vitest`, `@testing-library/*`, `jsdom`, `@vitejs/plugin-react` | Testes |
| Python: `psycopg`, `requests` | Coletor e scripts administrativos |

## Consequências

- **Modo Teste do Google.** Em modo Teste, o Google expira o refresh token após 7 dias. O Portal detecta isso e pede reconexão.
- **Limite do assistente.** O limite de requisições é em memória, por instância. Se o uso crescer, deve virar um limite distribuído.
- **Admin sem integrações Google.** O admin não usa as integrações Google; isso é decisão de produto.
