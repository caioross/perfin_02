import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { rotulo: string; name: string; prefixo: string };

// Campo com rótulo acessível, padrão dos formulários das calculadoras.
// `prefixo` garante ids únicos quando há várias calculadoras na mesma página.
export default function CampoFormulario({ rotulo, name, prefixo, ...atributos }: Props) {
  const id = `${prefixo}-${name}`;
  return (
    <div className="flex flex-col gap-1 text-sm">
      <label htmlFor={id}>{rotulo}</label>
      <input id={id} name={name} required className="rounded-lg border border-borda bg-superficie px-3 py-2" {...atributos} />
    </div>
  );
}
