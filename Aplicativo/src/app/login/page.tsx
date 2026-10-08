import type { Metadata } from "next";
import { Suspense } from "react";
import AbasAutenticacao from "@/componentes/auth/AbasAutenticacao";
import BotaoEntrarGoogle from "@/componentes/auth/BotaoEntrarGoogle";
import CartaoAutenticacao from "@/componentes/auth/CartaoAutenticacao";
import DivisorOu from "@/componentes/auth/DivisorOu";
import FormEntrar from "@/componentes/auth/FormEntrar";
import MensagemErroLogin from "@/componentes/auth/MensagemErroLogin";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaLogin() {
  return (
    <CartaoAutenticacao titulo="Entrar" subtitulo="Central de análise econômica do Perfin">
      <AbasAutenticacao ativa="entrar" />
      <Suspense fallback={null}>
        <MensagemErroLogin />
      </Suspense>
      <BotaoEntrarGoogle rotulo="Continuar com Google" variante="contorno" />
      <DivisorOu />
      <FormEntrar />
    </CartaoAutenticacao>
  );
}
