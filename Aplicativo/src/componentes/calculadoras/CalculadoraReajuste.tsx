"use client";

import { useActionState } from "react";
import { calcularReajuste, type EstadoCalculo } from "@/app/(portal)/calculadoras/acoes";
import { formatarMesCurto, formatarMoeda, formatarPercentual } from "@/lib/formatacao";
import type { ResultadoReajuste } from "@/servicos/calculadoras";
import CampoFormulario from "@/componentes/formulario/CampoFormulario";
import CartaoCalculadora from "./CartaoCalculadora";

const INICIAL: EstadoCalculo<ResultadoReajuste[]> = { erro: null, resultado: null };

// Regra C11: 12 meses encerrados no mês anterior ao aniversário, comparando os índices.
export default function CalculadoraReajuste() {
  const [estado, acao, enviando] = useActionState(calcularReajuste, INICIAL);
  const linhas = estado.resultado;
  return (
    <CartaoCalculadora titulo="Reajuste de aluguel ou contrato"
      descricao="Aplica a inflação dos 12 meses encerrados no mês anterior ao aniversário do contrato."
      acao={acao} enviando={enviando} erro={estado.erro}
      campos={
        <>
          <CampoFormulario prefixo="reajuste" rotulo="Valor atual (R$)" name="valor" type="number" min="0.01" step="0.01" />
          <CampoFormulario prefixo="reajuste" rotulo="Mês do aniversário" name="aniversario" type="month" min="2016-01" />
        </>
      }
      resultado={linhas && (
        <ul className="space-y-1 text-sm">
          {linhas.map((l) => (
            <li key={l.indicador_codigo} className="flex flex-wrap justify-between gap-2 border-b border-borda py-1">
              <span>{l.nome} ({formatarMesCurto(l.periodo_inicio)} a {formatarMesCurto(l.periodo_fim)})</span>
              <span className="numero">
                {l.percentual == null ? "ainda não publicado" : `${formatarPercentual(l.percentual)} → ${formatarMoeda(l.novo_valor)}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    />
  );
}
