import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import CartaoAutenticacao from "@/componentes/auth/CartaoAutenticacao";
import FormRedefinirSenha from "@/componentes/auth/FormRedefinirSenha";
import Carregando from "@/componentes/estados/Carregando";
import { criarClienteServidor } from "@/servicos/supabase/servidor";

export const metadata: Metadata = { title: "Nova senha" };

// Aberta pelo link de recuperação: /auth/confirmar já criou a sessão.
async function ConteudoRedefinir() {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?erro=link");
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
