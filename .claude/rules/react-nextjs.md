# Regras de React/Next.js do Perfin

Complementa `architecture.md`. Lógica de negócio não fica em componentes.

## Componentes

- Componentes funcionais com hooks; não use componentes de classe.
- Um componente por arquivo, com nome em PascalCase igual ao nome do arquivo.
- Componentes pequenos e com uma única responsabilidade; se crescer, divida.
- Componentes de UI recebem dados por props e não buscam dados diretamente; a busca fica em hooks, serviços ou Server Components.
- Antes de criar um componente, verifique se já existe um equivalente reutilizável.

## Next.js

- Siga o roteador que o projeto já usa (App Router ou Pages Router); não misture os dois.
- Prefira Server Components; use `"use client"` apenas quando houver estado, efeitos ou eventos do navegador.
- Use `next/image` para imagens e `next/link` para navegação interna.
- Toda página com busca de dados deve tratar os estados de carregamento, erro e vazio.

## Estado e efeitos

- Mantenha o estado o mais local possível; só eleve ou globalize quando necessário.
- Não use `useEffect` para calcular valores derivados de props ou estado; calcule durante a renderização.
- Todo `useEffect` deve ter dependências corretas e limpar o que criar (listeners, timers, assinaturas).
- Extraia lógica repetida de estado/efeitos para hooks customizados (`useAlgo`).

## TypeScript

- Use TypeScript com tipagem explícita de props; evite `any`.
- Tipos compartilhados ficam em um local central, não duplicados entre componentes.

## Dados e segurança

- Chaves secretas nunca vão para o navegador: somente variáveis `NEXT_PUBLIC_*` podem ser usadas no cliente, e apenas para valores públicos (ex.: URL e publishable key do Supabase).
- Toda entrada do usuário deve ser validada também no servidor; validação no cliente é só para experiência de uso.
- Valores monetários: não faça cálculos financeiros com ponto flutuante na interface; use os valores já calculados pela camada de negócio e formate com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.

## Estilo e acessibilidade

- Siga a solução de estilos já adotada no projeto; não introduza outra.
- Use elementos HTML semânticos (`button`, `nav`, `main`, `label`), `alt` em imagens e rótulos em campos de formulário.
- Listas renderizadas com `map` usam `key` estável (id), nunca o índice do array.

## Desempenho

- Não otimize prematuramente; use `useMemo`/`useCallback`/`React.memo` apenas quando houver problema medido ou necessidade clara.
- Carregue sob demanda (`next/dynamic`) componentes pesados que não são necessários na primeira renderização.
