"use client";

import { useActionState } from "react";
import { gerarRelatorioAcao, type EstadoRelatorio } from "@/app/(portal)/relatorios/acoes";
import { formatarMes } from "@/lib/formatacao";
import MensagemAcao from "./MensagemAcao";

const INICIAL: EstadoRelatorio = { erro: null, reconectar: false, sucesso: null };

type Props = { meses: string[] };

export default function FormGerarRelatorio({ meses }: Props) {
  const [estado, acao, enviando] = useActionState(gerarRelatorioAcao, INICIAL);
  return (
    <section className="space-y-3 rounded-xl border border-borda bg-superficie p-4">
      <form action={acao} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1 text-sm">
          <label htmlFor="mes-relatorio">Mês de referência (último mês fechado com IPCA publicado)</label>
          <select id="mes-relatorio" name="mes" defaultValue={meses[0]} className="rounded-lg border border-borda bg-superficie px-3 py-2">
            {meses.map((mes) => (
              <option key={mes} value={mes}>{formatarMes(mes)}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={enviando}
          className="rounded-lg bg-marca px-4 py-2 font-medium text-white hover:bg-marca-forte disabled:opacity-60">
          {enviando ? "Gerando planilha…" : "Gerar relatório"}
        </button>
      </form>
      <MensagemAcao estado={estado} />
    </section>
  );
}
