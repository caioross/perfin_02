"use client";

import { useActionState } from "react";
import { cadastrar, type EstadoCadastro } from "@/app/cadastro/acoes";
import { DICA_SENHA, SENHA_MAXIMO, SENHA_MINIMO } from "@/dominio/auth/limites";
import BotaoEnviar from "@/componentes/formulario/BotaoEnviar";
import CampoFormulario from "@/componentes/formulario/CampoFormulario";
import CampoSenha from "./CampoSenha";
import FormReenviarConfirmacao from "./FormReenviarConfirmacao";

const ESTADO_INICIAL: EstadoCadastro = { erro: null, emailEnviado: null, nome: "", email: "" };

// Cadastro por e-mail e senha; ao concluir, mostra "Confirme seu e-mail".
export default function FormCadastro() {
  const [estado, acao, enviando] = useActionState(cadastrar, ESTADO_INICIAL);

  if (estado.emailEnviado) {
    return (
      <div aria-live="polite" className="space-y-3 rounded-lg bg-marca-suave p-4 text-sm">
        <p className="font-medium">Confirme seu e-mail</p>
        <p>
          Enviamos um link de confirmação para <strong className="break-all">{estado.emailEnviado}</strong>. Abra o
          e-mail e clique no link para acessar o Portal. Não chegou? Confira a caixa de spam.
        </p>
        <FormReenviarConfirmacao email={estado.emailEnviado} />
      </div>
    );
  }

  return (
    <form action={acao} className="space-y-3">
      <CampoFormulario prefixo="cadastro" name="nome" rotulo="Nome" autoComplete="name" defaultValue={estado.nome} minLength={2} maxLength={120} />
      <CampoFormulario prefixo="cadastro" name="email" rotulo="E-mail" type="email" autoComplete="email" defaultValue={estado.email} maxLength={200} />
      <CampoSenha prefixo="cadastro" name="senha" rotulo="Senha" autoComplete="new-password"
        minLength={SENHA_MINIMO} maxLength={SENHA_MAXIMO} dica={DICA_SENHA} />
      <CampoSenha prefixo="cadastro" name="confirmacao" rotulo="Confirmar senha" autoComplete="new-password"
        minLength={SENHA_MINIMO} maxLength={SENHA_MAXIMO} />
      {estado.erro && <p role="alert" className="text-sm text-alerta">{estado.erro}</p>}
      <BotaoEnviar enviando={enviando} rotulo="Criar conta" rotuloEnviando="Criando conta…" />
    </form>
  );
}
