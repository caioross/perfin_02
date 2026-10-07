"use client";

import { useOffline } from "next/offline";

export default function BannerOffline() {
  const offline = useOffline();
  if (!offline) return null;
  return (
    <div role="status" className="bg-atencao-suave px-4 py-2 text-center text-sm text-atencao">
      Você está offline. As telas abertas continuam visíveis; o que depende de internet volta quando a conexão
      retornar.
    </div>
  );
}
