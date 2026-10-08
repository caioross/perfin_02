# 0002 — Cadastro aberto por e-mail/senha e CI das PRs

Data: 2026-10-08 · Status: aceita

## Contexto

O site institucional precisava de um botão **"Entrar / Cadastrar"** que permitisse entrar ou criar conta com e-mail e senha **ou** com Google. Até aqui só o Google dava acesso; cadastros por e-mail nasciam `sem_acesso`. Além disso, o GitHub não tinha automação que validasse as PRs.

## Decisões

1. **Cadastro aberto por e-mail.** Quem confirma o e-mail entra como `usuario`, decisão do responsável pelo produto.
   - O gatilho `criar_perfil_novo_usuario` passa a dar `usuario` aos provedores `google` e `email` (migration `…000010_cadastro_email.sql`).
   - O Portal nega sessões com e-mail não confirmado.
2. **Login só no domínio do Portal.**
   - Site e Portal são projetos diferentes em `*.vercel.app`, e o navegador não compartilha cookies entre eles.
   - O botão do site leva para `/login` (ou `/cadastro`) do Portal: um único lugar trata senha, MFA e sessão.
3. **Links de e-mail com `token_hash`.**
   - Confirmação e recuperação usam `/auth/confirmar?token_hash=…&type=…` (`verifyOtp`), que funciona em qualquer aparelho.
   - A página mostra o botão "Continuar", e o `verifyOtp` só roda no POST: leitores de link dos e-mails (ex.: Safe Links) não gastam o token.
   - O fluxo PKCE (`?code=`) fica só como alternativa, porque exige o mesmo navegador do cadastro.
   - Os templates de e-mail do Supabase precisam apontar para essa rota.
4. **Recursos Google só para contas criadas pelo Google.**
   - Agenda e relatório mostram "Disponível para quem entra com Google" para contas de e-mail.
   - O callback do Google **não guarda token** em conta de e-mail, mesmo com a vinculação automática do Supabase.
   - Motivo: evita a tomada de conta por pré-cadastro, em que o atacante cadastra o e-mail da vítima, a vítima confirma e depois entra com o Google.
5. **Limite do assistente no banco.**
   - Com cadastro aberto, o limite em memória por instância não protege o custo do Gemini.
   - A função `consumir_limite(chave)` (security definer, sempre `auth.uid()`, cota fixa em `cota_limite`) e a tabela `limites_uso` (RLS sem políticas) valem para todas as instâncias.
   - O login continua com limite em memória, somado aos limites do Supabase Auth.
6. **CI no GitHub Actions** (`.github/workflows/ci.yml`). Jobs `portal`, `site`, `python`, `banco` e `segredos`, exigidos na proteção da `main`.
   - O job `banco` sobe o Postgres do Supabase com o CLI (`supabase db start`) e aplica as migrations antes de rodar `testar_banco.py`. Assim, toda migration é testada antes de chegar à produção.
   - Dependências novas, **só no CI**: `supabase/setup-cli` e `gitleaks/gitleaks-action`. Nada novo no app.

## Consequências

- Qualquer pessoa pode usar painéis e assistente. Mitigações: limite no banco, bloqueio pelo admin e CAPTCHA opcional no Supabase.
- Os e-mails de confirmação exigem **SMTP próprio** no Supabase, porque o envio padrão só atende a equipe do projeto.
- O admin deve ser criado (`criar_admin.py`) antes de abrir o cadastro, para ninguém registrar o e-mail dele antes.
