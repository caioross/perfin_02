type Props = { enviando: boolean; rotulo: string; rotuloEnviando: string };

// Botão principal de envio dos formulários de autenticação.
export default function BotaoEnviar({ enviando, rotulo, rotuloEnviando }: Props) {
  return (
    <button type="submit" disabled={enviando}
      className="w-full rounded-lg bg-marca px-4 py-2.5 font-medium text-white hover:bg-marca-forte disabled:opacity-60">
      {enviando ? rotuloEnviando : rotulo}
    </button>
  );
}
