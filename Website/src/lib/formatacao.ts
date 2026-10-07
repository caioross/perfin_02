// Formatação pt-BR (o site só exibe valores calculados pelo banco).

const percentual = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cotacao = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4, maximumFractionDigits: 4 });

export function formatarValor(codigo: string, valor: number | null): string {
  if (valor == null) return "—";
  return codigo === "dolar" || codigo === "euro" ? cotacao.format(valor) : `${percentual.format(valor)}%`;
}

export function formatarPercentual(valor: number | null | undefined): string {
  return valor == null ? "—" : `${percentual.format(valor)}%`;
}

export function formatarReferencia(codigo: string, iso: string | null): string {
  if (!iso) return "—";
  const data = new Date(`${iso}T12:00:00Z`);
  const mensal = ["ipca", "igpm", "inpc", "cdi"].includes(codigo);
  return mensal
    ? `até ${data.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })}`
    : `em ${data.toLocaleDateString("pt-BR", { timeZone: "UTC" })}`;
}

export function formatarDataHora(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
}
