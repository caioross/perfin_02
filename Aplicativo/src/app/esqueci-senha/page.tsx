import type { Metadata } from "next";
import Link from "next/link";
import CartaoAutenticacao from "@/componentes/auth/CartaoAutenticacao";
import FormEsqueciSenha from "@/componentes/auth/FormEsqueciSenha";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default function PaginaEsqueciSenha() {
  return (
    <CartaoAutenticacao titulo="Esqueci minha senha" subtitulo="Enviaremos um link para você criar uma nova senha">
      <FormEsqueciSenha />
      <p className="text-center text-sm">
        <Link href="/login" className="text-marca underline-offset-2 hover:underline">Voltar para o login</Link>
      </p>
    </CartaoAutenticacao>
  );
}
