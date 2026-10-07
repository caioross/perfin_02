import type { Metadata } from "next";
import { Suspense } from "react";
import CalculadoraCorrecao from "@/componentes/calculadoras/CalculadoraCorrecao";
import CalculadoraPoderCompra from "@/componentes/calculadoras/CalculadoraPoderCompra";
import CalculadoraReajuste from "@/componentes/calculadoras/CalculadoraReajuste";
import CalculadoraRendimento from "@/componentes/calculadoras/CalculadoraRendimento";
import Carregando from "@/componentes/estados/Carregando";
import CabecalhoPagina from "@/componentes/painel/CabecalhoPagina";
import { exigirAcesso } from "@/lib/auth/sessao";

export const metadata: Metadata = { title: "Calculadoras" };

async function Calculadoras() {
  await exigirAcesso();
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <CalculadoraReajuste />
      <CalculadoraCorrecao />
      <CalculadoraPoderCompra />
      <CalculadoraRendimento />
    </div>
  );
}

export default function PaginaCalculadoras() {
  return (
    <>
      <CabecalhoPagina titulo="Calculadoras" descricao="Cálculos feitos no servidor com as mesmas fórmulas dos painéis e relatórios." />
      <Suspense fallback={<Carregando />}>
        <Calculadoras />
      </Suspense>
    </>
  );
}
