const SUGESTOES = [
  "Como está a inflação frente à meta?",
  "Para reajustar aluguel agora, IGP-M ou IPCA?",
  "Quanto o CDI rendeu acima da inflação no período?",
  "O que os dados mostram sobre o dólar no mês?",
];

type Props = { aoEscolher: (pergunta: string) => void; desabilitado: boolean };

export default function PerguntasSugeridas({ aoEscolher, desabilitado }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-texto-suave">Sugestões:</p>
      <ul className="flex flex-wrap gap-2">
        {SUGESTOES.map((s) => (
          <li key={s}>
            <button type="button" disabled={desabilitado} onClick={() => aoEscolher(s)}
              className="rounded-full border border-borda px-3 py-1 text-sm hover:bg-marca-suave disabled:opacity-60">
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
