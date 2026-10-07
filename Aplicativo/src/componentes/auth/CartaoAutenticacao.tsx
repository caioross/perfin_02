import type { ReactNode } from "react";

type Props = { titulo: string; subtitulo?: string; children: ReactNode };

// Moldura das telas públicas de autenticação.
export default function CartaoAutenticacao({ titulo, subtitulo, children }: Props) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-borda bg-superficie p-6 shadow-sm">
        <header className="space-y-1 text-center">
          <p className="text-sm font-semibold tracking-wide text-marca">Portal Perfin</p>
          <h1 className="text-xl font-semibold">{titulo}</h1>
          {subtitulo && <p className="text-sm text-texto-suave">{subtitulo}</p>}
        </header>
        {children}
      </div>
    </main>
  );
}
