"use client";

import { useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  rotulo: string;
  name: string;
  prefixo: string;
  dica?: string;
};

// Campo de senha com botão mostrar/ocultar e dica opcional ligada por aria-describedby.
export default function CampoSenha({ rotulo, name, prefixo, dica, ...atributos }: Props) {
  const [visivel, setVisivel] = useState(false);
  const id = `${prefixo}-${name}`;
  return (
    <div className="flex flex-col gap-1 text-sm">
      <label htmlFor={id}>{rotulo}</label>
      <div className="flex rounded-lg border border-borda bg-superficie focus-within:ring-2 focus-within:ring-marca/40">
        <input id={id} name={name} type={visivel ? "text" : "password"} required
          aria-describedby={dica ? `${id}-dica` : undefined}
          className="min-w-0 flex-1 rounded-l-lg bg-transparent px-3 py-2 outline-none" {...atributos} />
        <button type="button" onClick={() => setVisivel((v) => !v)} aria-pressed={visivel}
          aria-label={`${visivel ? "Ocultar" : "Mostrar"} ${rotulo.toLowerCase()}`}
          className="rounded-r-lg px-3 text-xs text-texto-suave hover:text-texto">
          {visivel ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {dica && <p id={`${id}-dica`} className="text-xs text-texto-suave">{dica}</p>}
    </div>
  );
}
