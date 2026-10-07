import type { ReactNode } from "react";

type Props = { titulo: string; descricao?: string; children?: ReactNode };

export default function CabecalhoPagina({ titulo, descricao, children }: Props) {
  return (
    <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-texto-suave">{descricao}</p>}
      </div>
      {children}
    </header>
  );
}
