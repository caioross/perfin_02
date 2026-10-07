"use client";

import { useActionState } from "react";
import { calcularCorrecao, type EstadoCalculo } from "@/app/(portal)/calculadoras/acoes";
import { formatarMes, formatarMoeda, formatarPercentual } from "@/lib/formatacao";
import type { ResultadoCorrecao } from "@/servicos/calculadoras";
import CampoFormulario from "@/componentes/formulario/CampoFormulario";
import CartaoCalculadora from "./CartaoCalculadora";

const INICIAL: EstadoCalculo<ResultadoCorrecao> = { erro: null, resultado: null };

export default function CalculadoraCorrecao() {
  const [estado, acao, enviando] = useActionState(calcularCorrecao, INICIAL);
  const r = estado.resultado;
  return (
    <CartaoCalculadora titulo="Correção de valores" descricao="Corrige um valor pela inflação acumulada entre dois meses (inclusive)."
      acao={acao} enviando={enviando} erro={estado.erro}
      campos={
        <>
          <div className="flex flex-col gap-1 text-sm">
            <label htmlFor="indice-correcao">Índice</label>
            <select id="indice-correcao" name="indice" className="rounded-lg border border-borda bg-superficie px-3 py-2">
              <option value="ipca">IPCA</option>
              <option value="igpm">IGP-M</option>
              <option value="inpc">INPC</option>
            </select>
          </div>
          <CampoFormulario prefixo="correcao" rotulo="Valor (R$)" name="valor" type="number" min="0.01" step="0.01" />
          <CampoFormulario prefixo="correcao" rotulo="Mês inicial" name="inicio" type="month" min="2015-01" />
          <CampoFormulario prefixo="correcao" rotulo="Mês final" name="fim" type="month" min="2015-01" />
        </>
      }
      resultado={r && (r.percentual == null
        ? <p className="text-sm text-texto-suave">Algum mês do período ainda não foi publicado.</p>
        : <p className="text-sm">Corrigido de {formatarMes(r.mes_inicio)} a {formatarMes(r.mes_fim)}: <strong className="numero text-lg">{formatarMoeda(r.valor_corrigido)}</strong> ({formatarPercentual(r.percentual)} no período).</p>)}
    />
  );
}
