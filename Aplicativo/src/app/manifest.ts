import type { MetadataRoute } from "next";

// Manifesto do PWA: permite instalar o Portal no celular e no computador.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Portal Perfin",
    short_name: "Perfin",
    description: "Central de análise econômica do time Perfin.",
    lang: "pt-BR",
    start_url: "/visao-geral",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f6f7f9",
    theme_color: "#0f6e66",
    categories: ["finance", "business", "productivity"],
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icones/icone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
