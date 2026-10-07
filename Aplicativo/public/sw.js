/* Service worker do Portal Perfin (PWA).
 *
 * Regras (Documentacao/regras-de-negocio.md §2.1):
 * - Cache-first: arquivos estáticos (/_next/static, /icones).
 * - Network-first: /api/indicadores/* (dados públicos do BCB) — mostra os últimos dados offline.
 * - Network-only: todo o resto (agenda, Gmail, relatórios, assistente, autenticação, perfil).
 * - Navegação sem rede: página /offline.
 * - Mensagem LIMPAR_DADOS (logout): apaga todos os caches.
 * - Mensagem PULAR_ESPERA: ativa a nova versão quando o usuário aceitar atualizar.
 */

const VERSAO = new URL(self.location.href).searchParams.get("v") || "dev";
const CACHE_ESTATICOS = `perfin-estaticos-${VERSAO}`;
const CACHE_DADOS = "perfin-dados";
const PAGINA_OFFLINE = "/offline";
const ARQUIVOS_INICIAIS = [PAGINA_OFFLINE, "/icones/icone-192.png", "/icones/icone-512.png"];

// Baixa a página offline e os scripts/estilos que ela usa, para funcionar sem rede.
async function preCarregar() {
  const cache = await caches.open(CACHE_ESTATICOS);
  await cache.addAll(ARQUIVOS_INICIAIS);
  const resposta = await cache.match(PAGINA_OFFLINE);
  if (!resposta) return;
  const html = await resposta.text();
  const recursos = [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)].map((m) => m[1]);
  await Promise.allSettled([...new Set(recursos)].map((url) => cache.add(url)));
}

self.addEventListener("install", (evento) => {
  evento.waitUntil(preCarregar());
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    (async () => {
      const nomes = await caches.keys();
      await Promise.all(
        nomes
          .filter((nome) => nome.startsWith("perfin-estaticos-") && nome !== CACHE_ESTATICOS)
          .map((nome) => caches.delete(nome)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (evento) => {
  if (evento.origin && evento.origin !== self.location.origin) return;
  const tipo = evento.data && evento.data.tipo;
  if (tipo === "PULAR_ESPERA") self.skipWaiting();
  if (tipo === "LIMPAR_DADOS") {
    evento.waitUntil(caches.keys().then((nomes) => Promise.all(nomes.map((nome) => caches.delete(nome)))));
  }
});

async function primeiroCache(requisicao) {
  const emCache = await caches.match(requisicao);
  if (emCache) return emCache;
  const resposta = await fetch(requisicao);
  if (resposta.ok) {
    const cache = await caches.open(CACHE_ESTATICOS);
    cache.put(requisicao, resposta.clone());
  }
  return resposta;
}

async function primeiroRede(requisicao) {
  try {
    const resposta = await fetch(requisicao);
    if (resposta.ok) {
      const cache = await caches.open(CACHE_DADOS);
      cache.put(requisicao, resposta.clone());
    }
    return resposta;
  } catch (erro) {
    const emCache = await caches.match(requisicao);
    if (emCache) return emCache;
    throw erro;
  }
}

async function navegar(requisicao) {
  try {
    return await fetch(requisicao);
  } catch {
    return (await caches.match(PAGINA_OFFLINE)) || Response.error();
  }
}

self.addEventListener("fetch", (evento) => {
  const requisicao = evento.request;
  if (requisicao.method !== "GET") return;
  const url = new URL(requisicao.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icones/")) {
    evento.respondWith(primeiroCache(requisicao));
  } else if (url.pathname.startsWith("/api/indicadores/")) {
    evento.respondWith(primeiroRede(requisicao));
  } else if (requisicao.mode === "navigate") {
    evento.respondWith(navegar(requisicao));
  }
  // Demais requisições: rede direta, sem cache.
});
