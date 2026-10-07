import type { ReactNode } from "react";

type Props = { id: string; titulo: string; children: ReactNode };

export default function Secao({ id, titulo, children }: Props) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-lg font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}
