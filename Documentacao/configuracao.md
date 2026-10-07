# Configuração e publicação — Portal Perfin

Siga na ordem. Os passos marcados com ✅ já foram feitos.

## 0. Segurança (antes de publicar)

- ✅ `dados_perfin.txt` foi enviado para a Lixeira do Windows. **Esvazie a Lixeira** depois de conferir que o `.env` tem tudo.
- [ ] **Rotacionar** as credenciais que estavam nesse arquivo:
  - [ ] Client secret do Google (Google Cloud → Credenciais → seu client OAuth → "Adicionar segredo" e depois apague o antigo).
  - [ ] Chave do Gemini (Google AI Studio → API keys).
  - [ ] Senha do banco (Supabase → Project Settings → Database → Reset database password). Atualize `DATABASE_URL` e `SUPABASE_DB_PASSWORD` no `.env`.
  - [ ] Senha do admin: defina uma nova com **12 caracteres ou mais** em `ADMIN_PASSWORD`.
- [ ] Acrescente ao `.env` da raiz (os scripts usam):

  ```
  SUPABASE_POOLER_HOST=aws-0-sa-east-1.pooler.supabase.com
  ```

## 1. Banco (Supabase)

- ✅ Migrations aplicadas (9 arquivos): tabelas, RLS, funções de cálculo, permissões e exigência de MFA (aal2) para poderes de admin no próprio banco.
- ✅ Carga inicial dos indicadores desde 2015, feita com o role `coletor_indicadores`.
- ✅ 20 testes de banco passando: cálculos conferidos com IBGE/FGV/B3/BCB e RLS por papel (inclui "admin sem MFA não tem poderes").
- [ ] Criar o admin (depois de trocar a senha no `.env`):

  ```bash
  python Aplicativo/supabase/scripts/criar_admin.py
  ```

- [ ] Gerar a senha do coletor e copiar a URL exibida para o GitHub (passo 3):

  ```bash
  python Aplicativo/supabase/scripts/definir_senha_coletor.py
  ```

- [ ] Supabase Dashboard:
  - **Authentication → Sign In / Providers → Email:**
    - habilitado;
    - "Confirm email" ligado.

    Cadastros por e-mail nascem `sem_acesso`.
  - **Authentication → Multi-Factor:** TOTP habilitado.
  - **Project Settings → API Keys:** copie a **Secret key** (`sb_secret_…`) para `SUPABASE_SECRET_KEY` na Vercel. Nunca a coloque no código.

## 2. Vercel — dois projetos ligados ao repositório `caioross/perfin_02`

| Projeto | Root Directory | Framework |
|---|---|---|
| Portal | `Aplicativo` | Next.js |
| Site | `Website` | Next.js |

**Variáveis do Portal** (Production e Preview):

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL do Portal na Vercel (ex.: `https://portal-perfin.vercel.app`) |
| `NEXT_PUBLIC_SUPABASE_URL` | do `.env` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | do `.env` |
| `SUPABASE_SECRET_KEY` | Secret key do Supabase |
| `GOOGLE_CLIENT_ID` | do `.env` |
| `GOOGLE_CLIENT_SECRET` | o **novo** secret |
| `GEMINI_API_KEY` | a **nova** chave |
| `GEMINI_MODEL` | modelo Gemini disponível na sua conta (ex.: o Flash mais recente) |
| `TOKEN_ENCRYPTION_KEY` | gere com `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |

**Variáveis do Site:**

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL do site |
| `NEXT_PUBLIC_PORTAL_URL` | URL do Portal |
| `NEXT_PUBLIC_SUPABASE_URL` | do `.env` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | do `.env` |

**Não** vão para a Vercel: `DATABASE_URL`, `SUPABASE_DB_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SUPABASE_POOLER_HOST`.

## 3. GitHub

- ✅ `git init` feito, com o remoto `origin` apontando para `https://github.com/caioross/perfin_02.git`.
- [ ] Primeiro commit e push (confira antes com `git status` que nenhum `.env` aparece).
- [ ] **Settings → Secrets and variables → Actions → New repository secret:** cadastre `COLETOR_DATABASE_URL` com a URL exibida pelo `definir_senha_coletor.py`.
- [ ] **Actions → "Coletar indicadores (BCB/SGS)" → Run workflow**, para testar. Depois ele roda sozinho nos dias úteis às 19h.

## 4. Google Cloud Console (com a URL da Vercel em mãos)

1. **APIs e serviços → Biblioteca:** ative Google Calendar API, Google Drive API, Google Sheets API e Gmail API.
2. **Tela de consentimento OAuth (Google Auth Platform):**
   - Tipo **Externo**, status **Teste**.
   - **Domínios autorizados:** `supabase.co` e `vercel.app`.
   - **Acesso a dados → Adicionar escopos:**
     - `.../auth/calendar.events.readonly`
     - `.../auth/drive.file`
     - `.../auth/gmail.compose`
     - `openid`, `email` e `profile`
   - **Público → Usuários de teste:** os e-mails do time que podem entrar.
3. **Credenciais → seu client OAuth (Aplicativo da Web):**
   - **Origens JavaScript autorizadas:** `https://<portal>.vercel.app`
   - **URIs de redirecionamento autorizados:** `https://tphqjblaspvyflzjinkq.supabase.co/auth/v1/callback`

> O modo Teste expira o acesso a cada 7 dias. O Portal mostra "Reconectar conta Google" quando isso acontece.

## 5. Supabase (com a URL da Vercel em mãos)

1. **Authentication → Sign In / Providers → Google:** habilite e cole o Client ID e o **novo** Client Secret.
2. **Authentication → URL Configuration:**
   - **Site URL:** `https://<portal>.vercel.app`
   - **Redirect URLs:** `https://<portal>.vercel.app/auth/callback`

## 6. Verificação final (na URL da Vercel)

- [ ] Login do admin (e-mail e senha), depois cadastro do autenticador (QR code) e acesso a `/admin`.
- [ ] Login Google de um usuário de teste: Visão geral com KPIs e insights.
- [ ] Login Google de um e-mail fora da lista de teste: barrado pelo Google.
- [ ] Bloquear um usuário no admin: ele passa a ver "acesso não autorizado".
- [ ] Filtros mudam cards, gráficos e insights; o link com o filtro abre igual em outra aba.
- [ ] Relatório do mês: a planilha aparece no Drive, o .xlsx baixa e o rascunho aparece em **Rascunhos** do Gmail (não enviado).
- [ ] Agenda lista as próximas reuniões.
- [ ] Assistente responde citando o período filtrado.
- [ ] PWA:
  - instalar no Android, no iPhone (Safari → Compartilhar → Tela de Início) e no desktop;
  - em modo avião, a página offline mostra os últimos dados;
  - depois de sair, DevTools → Application → Cache Storage está vazio.
- [ ] Site: o termômetro mostra os mesmos números da Visão geral.

## Comandos úteis

```bash
# Portal (dentro de Aplicativo/)
npm run lint
npm run typecheck
npm test
npm run build

# Um teste isolado
npx vitest run src/dominio/insights/insights.test.ts

# Banco (raiz do repositório)
python Aplicativo/supabase/scripts/aplicar_migrations.py
python Aplicativo/supabase/testes/testar_banco.py

# Coleta manual (com COLETOR_DATABASE_URL no ambiente)
python Aplicativo/coletor/coletor_indicadores.py
```
