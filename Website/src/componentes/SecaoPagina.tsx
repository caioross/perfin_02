import type { ReactNode } from "react";

type Props = { id: string; titulo: string; descricao?: string; children: ReactNode };

export default function SecaoPagina({ id, titulo, descricao, children }: Props) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="mx-auto max-w-6xl space-y-6 px-4 py-14">
      <header className="space-y-2">
        <h2 id={`${id}-titulo`} className="text-2xl font-semibold">{titulo}</h2>
        {descricao && <p className="text-texto-suave">{descricao}</p>}
      </header>
      {children}
    </section>
  );
}
