import type { Metadata } from "next";
import { Suspense } from "react";
import FormMeta from "@/componentes/admin/FormMeta";
import ListaMetas from "@/componentes/admin/ListaMetas";
import TabelaSaudeColeta from "@/componentes/admin/TabelaSaudeColeta";
import TabelaUsuarios from "@/componentes/admin/TabelaUsuarios";
import Carregando from "@/componentes/estados/Carregando";
import EstadoErro from "@/componentes/estados/EstadoErro";
import CabecalhoPagina from "@/componentes/painel/CabecalhoPagina";
import Secao from "@/componentes/painel/Secao";
import { exigirAcesso } from "@/lib/auth/sessao";
import { registrarErro } from "@/lib/erros";
import { listarMetas, listarPerfis, obterSaudeColeta } from "@/servicos/admin";

export const metadata: Metadata = { title: "Administração" };

async function ConteudoAdmin() {
  await exigirAcesso(["admin"]);
  let dados;
  try {
    const [perfis, metas, saude] = await Promise.all([listarPerfis(), listarMetas(), obterSaudeColeta()]);
    dados = { perfis, metas, saude };
  } catch (erro) {
    registrarErro("admin", erro);
    return <EstadoErro />;
  }
  const proximoAno = (dados.metas[0]?.ano ?? new Date().getFullYear()) + 1;
  return (
    <>
      <Secao id="titulo-coleta" titulo="Saúde da coleta e catálogo">
        <p className="text-sm text-texto-suave">Coleta diária pelo GitHub Actions (dias úteis, 19h). Indicador desativado some dos painéis, relatórios e site.</p>
        <TabelaSaudeColeta saude={dados.saude} />
      </Secao>
      <Secao id="titulo-usuarios" titulo="Usuários">
        <p className="text-sm text-texto-suave">Quem entra com Google é controlado pelos usuários de teste no Google Cloud; aqui você pode bloquear ou desbloquear.</p>
        <TabelaUsuarios perfis={dados.perfis} />
      </Secao>
      <Secao id="titulo-metas" titulo="Metas de inflação">
        <FormMeta proximoAno={proximoAno} />
        <ListaMetas metas={dados.metas} />
      </Secao>
    </>
  );
}

export default function PaginaAdmin() {
  return (
    <>
      <CabecalhoPagina titulo="Administração" descricao="Usuários, metas de inflação, catálogo de indicadores e saúde da coleta." />
      <Suspense fallback={<Carregando />}>
        <ConteudoAdmin />
      </Suspense>
    </>
  );
}
