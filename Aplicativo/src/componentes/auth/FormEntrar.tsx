"use client";

import Link from "next/link";
import { useActionState } from "react";
import { entrarComEmail, type EstadoLogin } from "@/app/login/acoes";
import BotaoEnviar from "@/componentes/formulario/BotaoEnviar";
import CampoFormulario from "@/componentes/formulario/CampoFormulario";
import CampoSenha from "./CampoSenha";
import FormReenviarConfirmacao from "./FormReenviarConfirmacao";

const ESTADO_INICIAL: EstadoLogin = { erro: null, emailNaoConfirmado: null, email: "" };

// Login por e-mail e senha (usuários e admin; o admin segue para a verificação em duas etapas).
export default function FormEntrar() {
  const [estado, acao, enviando] = useActionState(entrarComEmail, ESTADO_INICIAL);
  return (
    <div className="space-y-3">
      <form action={acao} className="space-y-3">
        <CampoFormulario prefixo="entrar" name="email" rotulo="E-mail" type="email" autoComplete="username" defaultValue={estado.email} maxLength={200} />
        <CampoSenha prefixo="entrar" name="senha" rotulo="Senha" autoComplete="current-password" maxLength={200} />
        <div className="text-right text-sm">
          <Link href="/esqueci-senha" className="text-marca underline-offset-2 hover:underline">Esqueci minha senha</Link>
        </div>
        {estado.erro && <p role="alert" className="text-sm text-alerta">{estado.erro}</p>}
        <BotaoEnviar enviando={enviando} rotulo="Entrar" rotuloEnviando="Entrando…" />
      </form>
      {estado.emailNaoConfirmado && <FormReenviarConfirmacao email={estado.emailNaoConfirmado} />}
    </div>
  );
}
