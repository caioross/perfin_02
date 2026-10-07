import type { Metadata } from "next";
import CartaoAutenticacao from "@/componentes/auth/CartaoAutenticacao";
import BotaoSair from "@/componentes/layout/BotaoSair";

export const metadata: Metadata = { title: "Acesso não autorizado" };

export default function PaginaNaoAutorizado() {
  return (
    <CartaoAutenticacao titulo="Acesso não autorizado">
      <p className="text-sm text-texto-suave">
        Sua conta não tem permissão para acessar o Portal Perfin. Se você acredita que isso é um engano, fale com o
        administrador do time.
      </p>
      <BotaoSair rotulo="Voltar para o login" />
    </CartaoAutenticacao>
  );
}
