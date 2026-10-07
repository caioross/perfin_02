"use client";

import { useActionState } from "react";
import { calcularPoderCompra, type EstadoCalculo } from "@/app/(portal)/calculadoras/acoes";
import { formatarMoeda, formatarPercentual } from "@/lib/formatacao";
import type { ResultadoPoderCompra } from "@/servicos/calculadoras";
import CampoFormulario from "@/componentes/formulario/CampoFormulario";
import CartaoCalculadora from "./CartaoCalculadora";

const INICIAL: EstadoCalculo<ResultadoPoderCompra> = { erro: null, resultado: null };

// Regra C12: equivalência pelo IPCA e perda de poder de compra.
export default function CalculadoraPoderCompra() {
  const [estado, acao, enviando] = useActionState(calcularPoderCompra, INICIAL);
  const r = estado.resultado;
  return (
    <CartaoCalculadora titulo="Poder de compra" descricao="Quanto um valor do passado equivale hoje, pelo IPCA."
      acao={acao} enviando={enviando} erro={estado.erro}
      campos={
        <>
          <CampoFormulario prefixo="poder" rotulo="Valor (R$)" name="valor" type="number" min="0.01" step="0.01" />
          <CampoFormulario prefixo="poder" rotulo="Mês de origem" name="inicio" type="month" min="2015-01" />
          <CampoFormulario prefixo="poder" rotulo="Mês de comparação" name="fim" type="month" min="2015-01" />
        </>
      }
      resultado={r && (r.inflacao == null
        ? <p className="text-sm text-texto-suave">Algum mês do período ainda não foi publicado.</p>
        : <p className="text-sm">Equivale a <strong className="numero text-lg">{formatarMoeda(r.valor_equivalente)}</strong>. Inflação de {formatarPercentual(r.inflacao)}; perda de poder de compra de {formatarPercentual(r.perda_poder_compra)}.</p>)}
    />
  );
}
