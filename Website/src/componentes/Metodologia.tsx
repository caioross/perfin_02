const ITENS = [
  ["Fonte", "Séries oficiais do Banco Central do Brasil (SGS), coletadas automaticamente todo dia útil."],
  ["Acumulados", "Taxas são compostas mês a mês, nunca somadas: (∏(1 + taxa) − 1)."],
  ["Juro real", "CDI de 12 meses descontado o IPCA do mesmo período (equação de Fisher)."],
  ["Meta de inflação", "Centro e tolerância definidos pelo Conselho Monetário Nacional para cada ano."],
  ["Dados ausentes", "Mês ainda não divulgado não é estimado: os números aparecem só quando publicados."],
];

export default function Metodologia() {
  return (
    <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {ITENS.map(([termo, descricao]) => (
        <div key={termo}>
          <dt className="font-semibold">{termo}</dt>
          <dd className="text-sm text-texto-suave">{descricao}</dd>
        </div>
      ))}
    </dl>
  );
}
