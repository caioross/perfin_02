// Aritmética de datas civis "AAAA-MM-DD" (sem fuso), usada por filtros e relatórios.

export function hojeEmSaoPaulo(agora: Date = new Date()): string {
  return agora.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function partes(iso: string): [number, number, number] {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return [ano, mes, dia];
}

function paraIso(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function diasNoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

// Soma meses mantendo o dia (limitado ao último dia do mês de destino).
export function somarMeses(iso: string, meses: number): string {
  const [ano, mes, dia] = partes(iso);
  const total = ano * 12 + (mes - 1) + meses;
  const novoAno = Math.floor(total / 12);
  const novoMes = (total % 12) + 1;
  return paraIso(novoAno, novoMes, Math.min(dia, diasNoMes(novoAno, novoMes)));
}

export function inicioDoMes(iso: string): string {
  const [ano, mes] = partes(iso);
  return paraIso(ano, mes, 1);
}

export function inicioDoAno(iso: string): string {
  return paraIso(partes(iso)[0], 1, 1);
}

export function fimDoMes(iso: string): string {
  const [ano, mes] = partes(iso);
  return paraIso(ano, mes, diasNoMes(ano, mes));
}

export function dataValida(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [ano, mes, dia] = partes(iso);
  return mes >= 1 && mes <= 12 && dia >= 1 && dia <= diasNoMes(ano, mes);
}
