import { entrarComGoogle } from "@/app/login/acoes";

type Props = { rotulo?: string; variante?: "primario" | "contorno" };

const ESTILOS = {
  primario: "bg-marca text-white hover:bg-marca-forte",
  contorno: "border border-borda bg-superficie hover:bg-superficie-2",
};

// Formulário com Server Action: funciona mesmo antes do JavaScript carregar.
export default function BotaoEntrarGoogle({ rotulo = "Entrar com Google", variante = "primario" }: Props) {
  return (
    <form action={entrarComGoogle}>
      <button type="submit" className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium ${ESTILOS[variante]}`}>
        <span aria-hidden="true" className="font-bold">G</span>
        {rotulo}
      </button>
    </form>
  );
}
