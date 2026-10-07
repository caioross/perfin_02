const RECURSOS = [
  { titulo: "Painéis de indicadores", texto: "IPCA, IGP-M, INPC, Selic, CDI, dólar e euro com filtro por período, gráficos e meta de inflação." },
  { titulo: "Insights automáticos", texto: "Inflação frente à meta, ciclo da Selic, juro real, câmbio e reajuste de aluguel explicados em uma frase." },
  { titulo: "Calculadoras", texto: "Reajuste de contrato, correção de valores, poder de compra e rendimento real de aplicações no CDI." },
  { titulo: "Relatório mensal em 1 clique", texto: "Planilha no Google Drive, download em Excel e rascunho de e-mail pronto para revisar." },
  { titulo: "Assistente de IA", texto: "Pergunte sobre os indicadores do período; as respostas usam apenas os números calculados pelo Portal." },
  { titulo: "App instalável", texto: "Instale no celular ou no computador e consulte os últimos indicadores mesmo sem internet." },
];

export default function Recursos() {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {RECURSOS.map((r) => (
        <li key={r.titulo} className="rounded-2xl border border-borda bg-superficie p-5">
          <h3 className="font-semibold">{r.titulo}</h3>
          <p className="mt-2 text-sm text-texto-suave">{r.texto}</p>
        </li>
      ))}
    </ul>
  );
}
