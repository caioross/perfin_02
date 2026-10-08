# Regras de negócio — Portal Perfin

Fonte única das regras do produto. Os números são calculados no banco (funções SQL em
`Aplicativo/supabase/migrations/`), e painel, relatório, assistente e site mostram o mesmo valor.

## 1. Perfis de acesso

| Perfil | Como entra | O que faz |
|---|---|---|
| **Admin** | E-mail e senha + **MFA TOTP obrigatório**. Criado uma única vez pelo script `criar_admin.py` (senha ≥ 12 caracteres), **antes** de abrir o cadastro. | Área de administração (usuários, metas, catálogo, saúde da coleta), painéis e calculadoras. Não usa Agenda, Gmail, Drive nem assistente. |
| **Usuário (Google)** | Login/cadastro Google. Quem pode entrar é controlado pela lista de **usuários de teste** do app OAuth no Google Cloud. | Painéis, calculadoras, relatório do mês, Agenda, rascunho no Gmail e assistente. |
| **Usuário (e-mail)** | **Cadastro aberto** com nome, e-mail e senha. Só entra depois de **confirmar o e-mail** pelo link recebido. | Painéis, calculadoras e assistente. Agenda, relatório e Gmail mostram "Disponível para quem entra com Google". |
| **Sem acesso / bloqueado** | Outro provedor de login, ou usuário bloqueado pelo admin. | Vê "acesso não autorizado". |

### Regras

- **Papel no cadastro.** O papel fica em `perfis.papel` e é definido por um gatilho quando o usuário é criado:
  - provedor Google ou e-mail → `usuario`;
  - qualquer outro provedor → `sem_acesso`.

  A regra é **fechada por padrão**: na dúvida, o acesso é negado.
- **Confirmação de e-mail.** O Supabase só emite sessão depois da confirmação. Mesmo assim, o Portal nega acesso a sessões com e-mail não confirmado.
- **Onde se entra.** O site institucional leva ao Portal pelo botão **"Entrar / Cadastrar"**. Login, cadastro e recuperação de senha acontecem só no domínio do Portal, porque site e Portal não compartilham sessão.
  - **Rotas:** `/login`, `/cadastro`, `/esqueci-senha`, `/redefinir-senha` e `/auth/confirmar` (links do e-mail).
  - `/auth/confirmar` mostra o botão "Continuar", e o token só é usado no clique (POST). Leitores de link dos provedores de e-mail não gastam o link.
  - `/redefinir-senha` só aceita a sessão aberta pelo link de recuperação (`amr = recovery`). A senha do admin é redefinida pelo painel do Supabase.
  - Google volta por `/auth/callback`.
- **Senha:**
  - **cadastro e redefinição:** 8 a 72 caracteres, com letras e números (validação no servidor);
  - **login:** aceita qualquer senha cadastrada.
- **Mensagens neutras.**
  - Login com erro diz sempre "E-mail ou senha inválidos".
  - Cadastro de e-mail já existente, reenvio de confirmação e "esqueci minha senha" respondem igual, exista a conta ou não.
  - "Confirme seu e-mail" só aparece com a senha correta.
- **Limites de tentativa.** Por e-mail, em memória, somados aos limites nativos do Supabase Auth:

  | Ação | Limite |
  |---|---|
  | Login | 5 a cada 15 min |
  | Cadastro | 3 por hora |
  | Reenvio de confirmação | 3 por hora |
  | Recuperação de senha | 3 por hora |

- **Recursos Google só para contas criadas pelo Google.**
  - Contas de e-mail veem em Agenda e relatório o aviso "Disponível para quem entra com Google", não um erro.
  - O token Google **nunca** é guardado numa conta de e-mail, mesmo que o Supabase vincule um login Google a ela depois.
  - Motivo: impede que alguém pré-cadastre o e-mail de outra pessoa e passe a usar o Google dela.
- **Bloqueio.**
  - O admin bloqueia e desbloqueia usuários Google e de e-mail.
  - O RLS impede alterar outro admin, promover alguém a admin e liberar um cadastro `sem_acesso`.
- **Checagem de acesso.** Toda página, Server Action e rota de API checa o papel no servidor, e o RLS do banco checa de novo.
- **MFA no banco.** Os poderes de admin exigem sessão **aal2** (senha + TOTP) também no banco (`eh_admin()`). Um token só com senha não age como admin nem pela API REST.
- **Admin e conta Google.** O admin não deve usar o mesmo e-mail em login Google. O callback do Google recusa quem não for `usuario`.
- **Cadastro aberto e custo.**
  - O limite do assistente (§6) é contado no banco (`consumir_limite`, tabela `limites_uso`) e vale para todas as instâncias do servidor.
  - A cota é fixa no banco (`cota_limite`); quem chama não escolhe o máximo nem a janela.
  - Se houver abuso: CAPTCHA no Supabase Auth e bloqueio pelo admin.
- **Admin pré-existente.** O `criar_admin.py` só promove uma conta já existente se o e-mail estiver confirmado e a senha conferir com `ADMIN_PASSWORD`.

## 2. Telas do Portal

O **filtro global** (período + indicadores) fica na URL e vale para painéis, insights e assistente.

- **Períodos:**
  - mês atual;
  - 3, 6 e 12 meses (contados de hoje para trás);
  - ano atual;
  - personalizado, entre `2015-01-01` e hoje.
- **Entrada inválida** volta ao padrão: 12 meses, com todos os indicadores.

| Tela | Conteúdo |
|---|---|
| Visão geral | KPIs (IPCA 12m com selo da meta, IPCA do mês, IGP-M e INPC 12m, Selic, CDI 12m, juro real, dólar, euro) e os 5 principais insights. |
| Inflação | Barras mensais, acumulado 12m com faixa da meta, tabela mês a mês e spread IGP-M − IPCA. |
| Juros | Selic em degraus, decisões do Copom, CDI × IPCA em base 100, juro real 12m. |
| Câmbio | Dólar e euro com média móvel de 21 dias úteis, variações, mínima/máxima, volatilidade. |
| Calculadoras | Reajuste de contrato, correção de valores, poder de compra, rendimento real de X% do CDI. |
| Relatório do mês | Planilha Google no Drive, download .xlsx, rascunho no Gmail. |
| Agenda | Próximas reuniões (14 dias) do Google Agenda do usuário. |
| Assistente | Chat com o Gemini sobre os dados filtrados. |
| Administração | Usuários, metas de inflação, catálogo e saúde da coleta. |

### 2.1 PWA

- **Instalação.** O Portal é instalável. Há o botão "Instalar app": prompt nativo no Android e no desktop, passo a passo no iOS.
- **Uso offline.**
  - Abre a página `/offline` com os últimos indicadores vistos e a data dos dados.
  - Agenda, Gmail, relatório e assistente ficam indisponíveis.
- **Cache do service worker:**
  - guarda só arquivos estáticos e `/api/indicadores/*` (dados públicos do BCB);
  - **nunca** guarda agenda, e-mails, tokens, respostas do assistente nem dados do perfil.
- **Saída.** Ao sair, todos os caches do aparelho são apagados.
- **Atualização.** Um deploy novo mostra "Nova versão disponível — atualizar". O app nunca troca de versão sozinho.

## 3. Dados de origem (BCB/SGS)

| Indicador | Série SGS | Unidade | Periodicidade |
|---|---|---|---|
| IPCA | 433 | % ao mês | mensal |
| INPC | 188 | % ao mês | mensal |
| IGP-M | 189 | % ao mês | mensal |
| Selic meta | 432 | % ao ano | diária |
| CDI | 12 | % ao dia | dias úteis |
| Dólar PTAX venda | 1 | R$ | dias úteis |
| Euro PTAX venda | 21619 | R$ | dias úteis |

- **Coleta.** O coletor Python roda nos dias úteis às 19h de Brasília (GitHub Actions). Ele busca a partir da última data gravada menos 45 dias, para captar revisões, e grava com upsert (sem duplicar).
- **Meta de inflação.** Fica na tabela `metas_inflacao` (centro e tolerância por ano) e é mantida pelo admin. A carga inicial vai de 2018 a 2026 (3,00% ± 1,50 p.p. desde 2024).

## 4. Regras de cálculo

| # | Cálculo | Fórmula / regra | Função SQL |
|---|---|---|---|
| C1 | Variação mensal | Valor publicado | `serie_inflacao` |
| C2 | Acumulado no período | `(∏(1 + vᵢ/100) − 1) × 100` — **nunca somar taxas** | `acumulado_mensal` |
| C3 | Acumulado 12m histórico | C2 em janela móvel de 12 meses | `serie_inflacao` |
| C4 | CDI acumulado | `∏(1 + dᵢ/100) − 1`; anualizado `(1 + d)^252 − 1` | `acumulado_diario`, `resumo_juros` |
| C5 | Juro real ex-post 12m | `(1 + CDI 12m) / (1 + IPCA 12m) − 1`, com CDI e IPCA nos **mesmos** 12 meses (encerrados no último mês com IPCA publicado) | `resumo_juros`, `serie_juros_mensal` |
| C6 | Inflação × meta | Distância = IPCA 12m − centro. Status: abaixo do piso / dentro / acima do teto | `status_meta_inflacao` |
| C7 | Spread | IGP-M 12m − IPCA 12m (p.p.) | `dominio/paineis/inflacao.ts` |
| C8 | Decisões da Selic | Dias em que a série 432 mudou. Ciclo: alta/queda conforme a última mudança; **manutenção** se a última mudança tem mais de 60 dias | `decisoes_selic`, `ciclo_selic` |
| C9 | Câmbio | Variação = último ÷ primeiro − 1; média, mín., máx.; volatilidade = desvio padrão dos retornos log diários × √252. Variações no mês, no ano e em 12m são relativas ao último valor anterior ao início de cada janela | `resumo_cambio`, `serie_diaria` |
| C10 | Correção de valores | `valor × ∏(1 + vᵢ/100)` do mês inicial ao final (inclusive) | `corrigir_valor` |
| C11 | Reajuste de contrato | C10 com os 12 meses encerrados no mês anterior ao aniversário, para cada índice | `reajuste_contrato` |
| C12 | Poder de compra | C10 com IPCA; perda = `1 − 1/(1 + inflação)` | `poder_de_compra` |
| C13 | Rendimento real de X% do CDI | Taxa diária × X%, depois C4; real contra o IPCA até o último mês publicado (`ipca_parcial` avisa) | `rendimento_real_cdi` |

Convenções:

- **Datas.** Séries mensais usam o 1º dia do mês. Os períodos incluem as duas pontas.
- **Dado não publicado.** Se faltar um mês, o acumulado retorna vazio ("ainda não publicado"). **Nunca estimamos.** O relatório usa o último mês fechado com IPCA publicado.
- **Precisão.** O banco guarda `numeric(18,6)` e só arredonda na exibição: % com 2 casas, câmbio com 4, R$ no formato `pt-BR`.
- **Validação das calculadoras:**
  - valor > 0 e ≤ 1 trilhão;
  - datas não futuras e início ≤ fim;
  - X% do CDI em (0, 300].

  A validação acontece no servidor (zod) e de novo no banco (`errcode 22023`).

## 5. Insights automáticos

Os insights são funções puras em `Aplicativo/src/dominio/insights/`, com limites em `limites.ts`.

| Tema | Regra | Severidade |
|---|---|---|
| Inflação × meta | C6 | acima do teto → alerta; abaixo do piso → atenção; dentro → informativo |
| Tendência | IPCA 12m subindo/caindo há **3 meses** seguidos (`MESES_TENDENCIA`) | acelera → atenção; desacelera → informativo |
| Mês acima do padrão | IPCA do mês × média dos **12** meses anteriores | acima → atenção; abaixo → informativo |
| Juro real | > **5%** → restritivo; < **0** → negativo | atenção / alerta / informativo |
| Ciclo da Selic | C8 | informativo |
| CDI × inflação | rendimento real do CDI no período | ganho → informativo; perda → alerta |
| Aluguel | IGP-M 12m × IPCA 12m e sinal do IGP-M | IGP-M negativo → atenção |
| Câmbio | variação no mês ≥ **3%** (para mais ou menos); máxima/mínima de 12m; volatilidade > **1,2×** a de 12m | atenção / informativo |
| Dado desatualizado | mensal > 45 dias após o fim do mês; diário > 5 dias úteis | alerta |

- **Ordem:** severidade (alerta, atenção, informativo) e, dentro dela, relevância (tamanho do desvio).
- **Filtro:** só aparecem insights ligados aos indicadores do filtro.

## 6. Relatório do mês e assistente

### Planilha Google

A planilha se chama "Perfin — Indicadores MM/AAAA" e é criada no Drive do usuário com o escopo `drive.file`. Abas:

- **Resumo:** KPIs, status da meta e destaques.
- **Inflação:** últimos 12 meses.
- **Juros:** Selic, decisões do mês, CDI e juro real.
- **Câmbio.**
- **Metodologia.**

### Ações sobre o relatório

- **Baixar .xlsx:** exporta a mesma planilha pelo Drive.
- **Rascunho no Gmail:** cria um rascunho com 3 a 5 destaques, o link da planilha e o .xlsx anexado, sem destinatário.
  - **O Portal nunca envia e-mails.** O wrapper do Gmail expõe só `drafts.create`, e um teste garante isso.

### Assistente (Gemini)

- **Não calcula.** O servidor busca os números do filtro (RLS do usuário) e os entrega como contexto.
- **Instruções ao modelo:** usar só esses números, citar o período, dizer "Não tenho esse dado no período filtrado" quando faltar, não inventar notícias, não dar recomendação de investimento e ignorar instruções na pergunta que tentem mudar as regras.
- **Limite:** 20 perguntas a cada 10 minutos por usuário, contadas no banco (`consumir_limite`). Perguntas com no máximo 1.000 caracteres.

## 7. Área do admin

- **Usuários:** bloquear e desbloquear usuários Google e de e-mail.
- **Metas de inflação:** criar e editar o centro e a tolerância de cada ano.
- **Catálogo:** ativar e desativar indicadores. Um indicador inativo some dos painéis, do relatório e do site, e deixa de ser coletado.
- **Saúde da coleta:** último dado, última execução, status, registros e erro por indicador. A fonte é a tabela `coletas`, gravada pelo coletor.

## 8. Site institucional

- **Seções:** hero, termômetro econômico, o que o Portal oferece, metodologia e rodapé.
- **Termômetro:** mostra só os últimos valores agregados, pela função `termometro_publico()`, a única liberada ao papel `anon`. É regerado a cada hora.

## 9. Resultados esperados

| Objetivo | Meta |
|---|---|
| Relatório mensal | pronto em menos de 1 minuto, com 1 clique |
| Dados atualizados | atraso ≤ 1 dia útil em relação ao BCB, com alerta de desatualizado |
| Fonte única | mesmo número no painel, relatório, assistente e site |
| Assistente confiável | nenhum número fora dos dados fornecidos |
| Segurança | e-mail nunca enviado sozinho; RLS em todas as tabelas; nenhum segredo no código |
