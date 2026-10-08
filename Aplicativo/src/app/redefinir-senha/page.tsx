import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import CartaoAutenticacao from "@/componentes/auth/CartaoAutenticacao";
import FormRedefinirSenha from "@/componentes/auth/FormRedefinirSenha";
import Carregando from "@/componentes/estados/Carregando";
import { obterSessaoDeRecuperacao } from "@/lib/auth/recuperacao";

export const metadata: Metadata = { title: "Nova senha" };

// Aberta pelo link de recuperação (a confirmação em /auth/confirmar cria a sessão "recovery").
async function ConteudoRedefinir() {
  if (!(await obterSessaoDeRecuperacao())) redirect("/login?erro=link");
  return <FormRedefinirSenha />;
}

export default function PaginaRedefinirSenha() {
  return (
    <CartaoAutenticacao titulo="Criar nova senha">
      <Suspense fallback={<Carregando texto="Verificando link…" />}>
        <ConteudoRedefinir />
      </Suspense>
    </CartaoAutenticacao>
  );
}
