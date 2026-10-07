import { Suspense } from "react";
import AquecerCacheOffline from "@/componentes/pwa/AquecerCacheOffline";
import MenuPortal from "@/componentes/layout/MenuPortal";
import { exigirAcesso } from "@/lib/auth/sessao";

async function MenuDoUsuario() {
  const usuario = await exigirAcesso();
  return <MenuPortal usuario={usuario} />;
}

export default function LayoutPortal({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1">
      <Suspense fallback={<div className="hidden w-60 shrink-0 border-r border-borda bg-superficie md:block" />}>
        <MenuDoUsuario />
      </Suspense>
      <main className="min-w-0 flex-1 px-4 pb-24 pt-5 md:px-8 md:pb-8">
        <div className="mx-auto max-w-6xl space-y-6">{children}</div>
      </main>
      <AquecerCacheOffline />
    </div>
  );
}
