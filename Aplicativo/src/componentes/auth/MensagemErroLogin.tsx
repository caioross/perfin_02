"use client";

import { useSearchParams } from "next/navigation";

const MENSAGENS: Record<string, string> = {
  google: "Não foi possível entrar com o Google. Tente novamente.",
  link: "O link é inválido ou expirou. Entre novamente ou peça um novo link.",
};

export default function MensagemErroLogin() {
  const erro = useSearchParams().get("erro");
  const mensagem = erro && Object.hasOwn(MENSAGENS, erro) ? MENSAGENS[erro] : null;
  if (!mensagem) return null;
  return <p role="alert" className="rounded-lg bg-alerta-suave px-3 py-2 text-sm text-alerta">{mensagem}</p>;
}
