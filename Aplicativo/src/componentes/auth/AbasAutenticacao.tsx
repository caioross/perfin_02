import Link from "next/link";

type Props = { ativa: "entrar" | "cadastro" };

const ABAS = [
  { id: "entrar", rotulo: "Entrar", href: "/login" },
  { id: "cadastro", rotulo: "Criar conta", href: "/cadastro" },
] as const;

// Alternância Entrar | Criar conta (links comuns: funcionam sem JavaScript).
export default function AbasAutenticacao({ ativa }: Props) {
  return (
    <nav aria-label="Acesso" className="grid grid-cols-2 rounded-lg bg-superficie-2 p-1 text-sm font-medium">
      {ABAS.map((aba) => (
        <Link key={aba.id} href={aba.href} aria-current={aba.id === ativa ? "page" : undefined}
          className={`rounded-md px-3 py-1.5 text-center ${aba.id === ativa ? "bg-superficie shadow-sm" : "text-texto-suave hover:text-texto"}`}>
          {aba.rotulo}
        </Link>
      ))}
    </nav>
  );
}
