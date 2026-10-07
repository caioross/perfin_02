import type { ReactNode } from "react";

type Props = {
  titulo: string;
  descricao: string;
  acao: (formulario: FormData) => void;
  enviando: boolean;
  erro: string | null;
  campos: ReactNode;
  resultado: ReactNode;
};

// Moldura comum: formulário, botão, erro e área de resultado (anunciada a leitores de tela).
export default function CartaoCalculadora({ titulo, descricao, acao, enviando, erro, campos, resultado }: Props) {
  return (
    <section className="space-y-3 rounded-xl border border-borda bg-superficie p-4">
      <header>
        <h2 className="font-semibold">{titulo}</h2>
        <p className="text-sm text-texto-suave">{descricao}</p>
      </header>
      <form action={acao} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {campos}
        <button type="submit" disabled={enviando}
          className="rounded-lg bg-marca px-4 py-2 font-medium text-white hover:bg-marca-forte disabled:opacity-60 sm:col-span-2">
          {enviando ? "Calculando…" : "Calcular"}
        </button>
      </form>
      <div aria-live="polite">
        {erro && <p role="alert" className="text-sm text-alerta">{erro}</p>}
        {resultado}
      </div>
    </section>
  );
}
