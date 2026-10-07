"use client";

import { useEffect, useState } from "react";
import { formatarCotacao, formatarDataHora, formatarPercentual } from "@/lib/formatacao";
import type { ResumoOffline } from "@/tipos/offline";

const URL_RESUMO = "/api/indicadores/resumo";

// Mostra os últimos indicadores guardados pelo service worker (sem rede).
export default function UltimosIndicadoresOffline() {
  const [resumo, setResumo] = useState<ResumoOffline | null>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const resposta = "caches" in window ? await caches.match(URL_RESUMO) : undefined;
        const dados = resposta ? ((await resposta.json()) as ResumoOffline) : null;
        if (ativo) setResumo(dados);
      } catch {
        if (ativo) setResumo(null);
      } finally {
        if (ativo) setCarregado(true);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  if (!carregado) return null;
  if (!resumo) {
    return <p className="text-sm text-texto-suave">Nenhum dado guardado neste aparelho ainda. Abra o Portal com internet uma vez.</p>;
  }
  return (
    <div className="space-y-3">
      <p className="rounded-lg bg-atencao-suave px-3 py-2 text-sm text-atencao">
        Você está offline — dados de {formatarDataHora(resumo.gerado_em)}.
      </p>
      <dl className="grid grid-cols-2 gap-3">
        {resumo.itens.map((item) => (
          <div key={item.rotulo} className="rounded-lg border border-borda p-3">
            <dt className="text-xs text-texto-suave">{item.rotulo}</dt>
            <dd className="numero text-lg font-semibold">
              {item.formato === "cotacao" ? formatarCotacao(item.valor) : formatarPercentual(item.valor)}
            </dd>
          </div>
        ))}
      </dl>
      {resumo.destaques.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {resumo.destaques.map((texto) => (
            <li key={texto}>{texto}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
