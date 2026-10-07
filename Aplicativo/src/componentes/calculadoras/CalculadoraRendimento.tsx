"use client";

import { useActionState } from "react";
import { calcularRendimento, type EstadoCalculo } from "@/app/(portal)/calculadoras/acoes";
import { formatarMes, formatarMoeda, formatarPercentual } from "@/lib/formatacao";
import type { ResultadoRendimento } from "@/servicos/calculadoras";
import CampoFormulario from "@/componentes/formulario/CampoFormulario";
import CartaoCalculadora from "./CartaoCalculadora";

const INICIAL: EstadoCalculo<ResultadoRendimento> = { erro: null, resultado: null };

// Regra C13: rendimento nominal e real de uma aplicação a X% do CDI.
export default function CalculadoraRendimento() {
  const [estado, acao, enviando] = useActionState(calcularRendimento, INICIAL);
  const r = estado.resultado;
  return (
    <CartaoCalculadora titulo="Rendimento real de X% do CDI"
      descricao="Rendimento bruto (sem impostos e taxas) e quanto sobra acima da inflação."
      acao={acao} enviando={enviando} erro={estado.erro}
      campos={
        <>
          <CampoFormulario prefixo="rendimento" rotulo="Valor aplicado (R$)" name="valor" type="number" min="0.01" step="0.01" />
          <CampoFormulario prefixo="rendimento" rotulo="% do CDI" name="percentual" type="number" min="1" max="300" step="0.1" defaultValue="100" />
          <CampoFormulario prefixo="rendimento" rotulo="Data inicial" name="inicio" type="date" min="2015-01-01" />
          <CampoFormulario prefixo="rendimento" rotulo="Data final" name="fim" type="date" min="2015-01-01" />
        </>
      }
      resultado={r && (
        <div className="space-y-1 text-sm">
          <p>Valor final: <strong className="numero text-lg">{formatarMoeda(r.valor_final)}</strong> (ganho de {formatarMoeda(r.ganho_nominal)}).</p>
          <p>Rendimento nominal: {formatarPercentual(r.rendimento_nominal)} · IPCA: {formatarPercentual(r.ipca_periodo)} · <strong>Real: {formatarPercentual(r.rendimento_real)}</strong></p>
          {r.ipca_parcial && <p className="text-texto-suave">IPCA considerado até {formatarMes(r.ipca_ate)} (último mês publicado).</p>}
        </div>
      )}
    />
  );
}
