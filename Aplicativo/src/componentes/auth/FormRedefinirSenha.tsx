"use client";

import { useActionState } from "react";
import { redefinirSenha, type EstadoRedefinicao } from "@/app/redefinir-senha/acoes";
import { DICA_SENHA, SENHA_MAXIMO, SENHA_MINIMO } from "@/dominio/auth/limites";
import BotaoEnviar from "@/componentes/formulario/BotaoEnviar";
import CampoSenha from "./CampoSenha";

const ESTADO_INICIAL: EstadoRedefinicao = { erro: null };

export default function FormRedefinirSenha() {
  const [estado, acao, enviando] = useActionState(redefinirSenha, ESTADO_INICIAL);
  return (
    <form action={acao} className="space-y-3">
      <CampoSenha prefixo="redefinir" name="senha" rotulo="Nova senha" autoComplete="new-password"
        minLength={SENHA_MINIMO} maxLength={SENHA_MAXIMO} dica={DICA_SENHA} />
      <CampoSenha prefixo="redefinir" name="confirmacao" rotulo="Confirmar nova senha" autoComplete="new-password"
        minLength={SENHA_MINIMO} maxLength={SENHA_MAXIMO} />
      {estado.erro && <p role="alert" className="text-sm text-alerta">{estado.erro}</p>}
      <BotaoEnviar enviando={enviando} rotulo="Salvar nova senha" rotuloEnviando="Salvando…" />
    </form>
  );
}
