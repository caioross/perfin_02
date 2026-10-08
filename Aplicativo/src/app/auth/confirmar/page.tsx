import type { Metadata } from "next";
import { Suspense } from "react";
import CartaoAutenticacao from "@/componentes/auth/CartaoAutenticacao";
import Carregando from "@/componentes/estados/Carregando";
import BotaoEnviar from "@/componentes/formulario/BotaoEnviar";
import { confirmarLink } from "./acoes";

export const metadata: Metadata = { title: "Confirmar acesso" };

const CAMPOS = ["token_hash", "type", "code"] as const;

// Página intermediária dos links de e-mail: o token só é usado no clique (POST).
async function FormConfirmar({ searchParams }: { searchParams: PageProps<"/auth/confirmar">["searchParams"] }) {
  const parametros = await searchParams;
  const valor = (nome: string) => (typeof parametros[nome] === "string" ? (parametros[nome] as string).slice(0, 2000) : "");
  const recuperacao = valor("type") === "recovery";
  return (
    <form action={confirmarLink} className="space-y-4">
      {CAMPOS.map((nome) => <input key={nome} type="hidden" name={nome} value={valor(nome)} />)}
      <p className="text-sm text-texto-suave">
        {recuperacao ? "Clique em continuar para criar uma nova senha." : "Clique em continuar para confirmar seu e-mail e entrar no Portal."}
      </p>
      <BotaoEnviar enviando={false} rotulo="Continuar" rotuloEnviando="Continuando…" />
    </form>
  );
}

export default function PaginaConfirmar({ searchParams }: PageProps<"/auth/confirmar">) {
  return (
    <CartaoAutenticacao titulo="Confirmar acesso">
      <Suspense fallback={<Carregando />}>
        <FormConfirmar searchParams={searchParams} />
      </Suspense>
    </CartaoAutenticacao>
  );
}
