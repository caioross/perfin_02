type Props = { valores: number[]; rotulo: string };

const LARGURA = 96;
const ALTURA = 28;

// Mini-gráfico (sparkline) em SVG puro, renderizado no servidor. Só posiciona pontos na tela.
export default function MiniTendencia({ valores, rotulo }: Props) {
  if (valores.length < 2) return null;
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const amplitude = maximo - minimo || 1;
  const pontos = valores
    .map((v, i) => `${((i / (valores.length - 1)) * LARGURA).toFixed(1)},${(ALTURA - ((v - minimo) / amplitude) * ALTURA).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={LARGURA} height={ALTURA} viewBox={`0 -2 ${LARGURA} ${ALTURA + 4}`} role="img" aria-label={rotulo} className="text-marca">
      <polyline points={pontos} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
