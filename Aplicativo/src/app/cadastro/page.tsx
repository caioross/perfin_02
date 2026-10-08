import type { Metadata } from "next";
import AbasAutenticacao from "@/componentes/auth/AbasAutenticacao";
import BotaoEntrarGoogle from "@/componentes/auth/BotaoEntrarGoogle";
import CartaoAutenticacao from "@/componentes/auth/CartaoAutenticacao";
import DivisorOu from "@/componentes/auth/DivisorOu";
import FormCadastro from "@/componentes/auth/FormCadastro";

export const metadata: Metadata = { title: "Criar conta" };

export default function PaginaCadastro() {
  return (
    <CartaoAutenticacao titulo="Criar conta" subtitulo="Painéis, calculadoras e assistente sobre os indicadores do Brasil">
      <AbasAutenticacao ativa="cadastro" />
      <div className="space-y-1">
        <BotaoEntrarGoogle rotulo="Cadastrar com Google" variante="contorno" />
        <p className="text-center text-xs text-texto-suave">
          Com o Google você também usa Agenda, relatório no Drive e rascunho no Gmail.
        </p>
      </div>
      <DivisorOu />
      <FormCadastro />
    </CartaoAutenticacao>
  );
}
