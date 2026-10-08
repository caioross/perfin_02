import { Suspense } from "react";
import BotaoPortal from "@/componentes/BotaoPortal";
import Metodologia from "@/componentes/Metodologia";
import Recursos from "@/componentes/Recursos";
import SecaoPagina from "@/componentes/SecaoPagina";
import Termometro from "@/componentes/Termometro";

export default function PaginaInicial() {
  return (
    <>
      <header className="border-b border-borda bg-superficie">
        <nav aria-label="Principal" className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-lg font-semibold text-marca">Perfin</span>
          <BotaoPortal variante="secundario" rotulo="Entrar / Cadastrar" />
        </nav>
      </header>
      <main>
        <section className="mx-auto max-w-6xl space-y-6 px-4 py-16 md:py-24">
          <p className="text-sm font-semibold uppercase tracking-wide text-marca">Central de análise econômica</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
            Os indicadores do Brasil, explicados e prontos para decidir.
          </h1>
          <p className="max-w-2xl text-lg text-texto-suave">
            O Portal Perfin reúne inflação, juros e câmbio do Banco Central em painéis, insights, relatórios e um
            assistente de IA. Crie sua conta com e-mail ou Google.
          </p>
          <div className="flex flex-wrap gap-3">
            <BotaoPortal destino="/cadastro" rotulo="Criar conta grátis" />
            <BotaoPortal variante="secundario" rotulo="Já tenho conta" />
          </div>
        </section>
        <SecaoPagina id="termometro" titulo="Termômetro econômico" descricao="Os últimos números oficiais, atualizados todo dia útil.">
          <Suspense fallback={<p className="text-texto-suave">Carregando indicadores…</p>}>
            <Termometro />
          </Suspense>
        </SecaoPagina>
        <SecaoPagina id="portal" titulo="O que o Portal oferece">
          <Recursos />
        </SecaoPagina>
        <SecaoPagina id="metodologia" titulo="Metodologia e fontes">
          <Metodologia />
        </SecaoPagina>
      </main>
      <footer className="border-t border-borda">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-texto-suave md:flex-row md:justify-between">
          <p>Perfin — finanças pessoais e análise econômica.</p>
          <p>Dados: Banco Central do Brasil. Conteúdo informativo, não é recomendação de investimento.</p>
        </div>
      </footer>
    </>
  );
}
