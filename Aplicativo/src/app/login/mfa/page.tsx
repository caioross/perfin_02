import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import CadastroMfa from "@/componentes/auth/CadastroMfa";
import CartaoAutenticacao from "@/componentes/auth/CartaoAutenticacao";
import FormCodigoMfa from "@/componentes/auth/FormCodigoMfa";
import Carregando from "@/componentes/estados/Carregando";
import { exigirAdminAntesDoMfa } from "@/lib/auth/sessao";

export const metadata: Metadata = { title: "Verificação em duas etapas" };

async function ConteudoMfa() {
  const { supabase } = await exigirAdminAntesDoMfa();
  const { data: nivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (nivel?.currentLevel === "aal2") redirect("/admin");

  const { data: fatores } = await supabase.auth.mfa.listFactors();
  const verificado = fatores?.totp.find((f) => f.status === "verified");
  return verificado ? <FormCodigoMfa fatorId={verificado.id} /> : <CadastroMfa />;
}

export default function PaginaMfa() {
  return (
    <CartaoAutenticacao titulo="Verificação em duas etapas" subtitulo="Acesso do administrador">
      <Suspense fallback={<Carregando texto="Verificando sessão…" />}>
        <ConteudoMfa />
      </Suspense>
    </CartaoAutenticacao>
  );
}
