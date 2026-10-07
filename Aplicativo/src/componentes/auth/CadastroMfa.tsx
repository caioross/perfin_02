"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { iniciarCadastroMfa, type CadastroMfa as DadosCadastro } from "@/app/login/mfa/acoes";
import FormCodigoMfa from "./FormCodigoMfa";

// Primeiro acesso do admin: cadastra o autenticador (TOTP) e confirma com um código.
export default function CadastroMfa() {
  const [cadastro, setCadastro] = useState<DadosCadastro | null>(null);
  const [pendente, iniciarTransicao] = useTransition();

  if (!cadastro || "erro" in cadastro) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-texto-suave">
          O acesso de administrador exige verificação em duas etapas. Use um aplicativo autenticador (Google
          Authenticator, Microsoft Authenticator, 1Password etc.).
        </p>
        {cadastro && "erro" in cadastro && <p role="alert" className="text-sm text-alerta">{cadastro.erro}</p>}
        <button type="button" disabled={pendente}
          onClick={() => iniciarTransicao(async () => setCadastro(await iniciarCadastroMfa()))}
          className="w-full rounded-lg bg-marca px-4 py-2 font-medium text-white hover:bg-marca-forte disabled:opacity-60">
          {pendente ? "Preparando…" : "Configurar autenticador"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-texto-suave">Escaneie o QR code no aplicativo autenticador e digite o código gerado.</p>
      <Image src={cadastro.qrCode} alt="QR code para cadastrar o autenticador" width={192} height={192} unoptimized
        className="mx-auto rounded-lg bg-white p-2" />
      <details className="text-sm">
        <summary className="cursor-pointer text-texto-suave">Não consegue escanear? Use a chave manual</summary>
        <code className="mt-2 block break-all rounded bg-superficie-2 p-2">{cadastro.segredo}</code>
      </details>
      <FormCodigoMfa fatorId={cadastro.fatorId} />
    </div>
  );
}
