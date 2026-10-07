import { entrarComGoogle } from "@/app/login/acoes";

type Props = { rotulo?: string };

// Formulário com Server Action: funciona mesmo antes do JavaScript carregar.
export default function BotaoEntrarGoogle({ rotulo = "Entrar com Google" }: Props) {
  return (
    <form action={entrarComGoogle}>
      <button type="submit" className="w-full rounded-lg bg-marca px-4 py-2.5 font-medium text-white hover:bg-marca-forte">
        {rotulo}
      </button>
    </form>
  );
}
