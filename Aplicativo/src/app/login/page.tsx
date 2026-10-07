import type { Metadata } from "next";
import { Suspense } from "react";
import BotaoEntrarGoogle from "@/componentes/auth/BotaoEntrarGoogle";
import CartaoAutenticacao from "@/componentes/auth/CartaoAutenticacao";
import FormLoginAdmin from "@/componentes/auth/FormLoginAdmin";
import MensagemErroLogin from "@/componentes/auth/MensagemErroLogin";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaLogin() {
  return (
    <CartaoAutenticacao titulo="Entrar" subtitulo="Central de análise econômica do time">
      <Suspense fallback={null}>
        <MensagemErroLogin />
      </Suspense>
      <section aria-labelledby="titulo-usuario" className="space-y-2">
        <h2 id="titulo-usuario" className="text-sm font-medium text-texto-suave">Equipe</h2>
        <BotaoEntrarGoogle />
      </section>
      <details className="rounded-lg border border-borda p-3">
        <summary className="cursor-pointer text-sm font-medium text-texto-suave">Acesso do administrador</summary>
        <div className="pt-3">
          <FormLoginAdmin />
        </div>
      </details>
    </CartaoAutenticacao>
  );
}
