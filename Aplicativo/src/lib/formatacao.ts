// Formatação pt-BR para exibição. Não faz cálculos: os valores chegam prontos do banco.

const FUSO = "America/Sao_Paulo";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const cotacao = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});
const percentual = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pontos = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

const SEM_DADO = "—";

export function formatarMoeda(valor: number | null | undefined): string {
  return valor == null ? SEM_DADO : moeda.format(valor);
}

export function formatarCotacao(valor: number | null | undefined): string {
  return valor == null ? SEM_DADO : cotacao.format(valor);
}

export function formatarPercentual(valor: number | null | undefined): string {
  return valor == null ? SEM_DADO : `${percentual.format(valor)}%`;
}

export function formatarPontosPercentuais(valor: number | null | undefined, comSinal = true): string {
  if (valor == null) return SEM_DADO;
  return `${comSinal ? pontos.format(valor) : percentual.format(Math.abs(valor))} p.p.`;
}

// Datas do banco chegam como "AAAA-MM-DD" (sem fuso); são tratadas como data civil.
function dataCivil(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

export function formatarData(iso: string | null | undefined): string {
  return iso ? dataCivil(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : SEM_DADO;
}

export function formatarMes(iso: string | null | undefined): string {
  if (!iso) return SEM_DADO;
  const texto = dataCivil(iso).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatarMesCurto(iso: string): string {
  return dataCivil(iso).toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric", timeZone: "UTC" });
}

export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return SEM_DADO;
  return new Date(iso).toLocaleString("pt-BR", { timeZone: FUSO, dateStyle: "short", timeStyle: "short" });
}
