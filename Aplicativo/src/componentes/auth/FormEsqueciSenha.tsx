"use client";

import { useActionState } from "react";
import { pedirRecuperacao, type EstadoRecuperacao } from "@/app/esqueci-senha/acoes";
import BotaoEnviar from "@/componentes/formulario/BotaoEnviar";
import CampoFormulario from "@/componentes/formulario/CampoFormulario";

const ESTADO_INICIAL: EstadoRecuperacao = { erro: null, enviado: false };

export default function FormEsqueciSenha() {
  const [estado, acao, enviando] = useActionState(pedirRecuperacao, ESTADO_INICIAL);
  if (estado.enviado) {
    return (
      <p aria-live="polite" className="rounded-lg bg-marca-suave p-4 text-sm">
        Se existir uma conta com esse e-mail, enviamos um link para criar uma nova senha. Confira também o spam.
      </p>
    );
  }
  return (
    <form action={acao} className="space-y-3">
      <CampoFormulario prefixo="recuperar" name="email" rotulo="E-mail da conta" type="email" autoComplete="email" maxLength={200} />
      {estado.erro && <p role="alert" className="text-sm text-alerta">{estado.erro}</p>}
      <BotaoEnviar enviando={enviando} rotulo="Enviar link" rotuloEnviando="Enviando…" />
    </form>
  );
}
