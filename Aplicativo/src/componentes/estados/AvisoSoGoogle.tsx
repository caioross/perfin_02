import EstadoVazio from "./EstadoVazio";

type Props = { recurso: string };

// Recurso que depende da conta Google, para quem entrou por e-mail e senha.
export default function AvisoSoGoogle({ recurso }: Props) {
  return (
    <EstadoVazio
      titulo="Disponível para quem entra com Google"
      descricao={`${recurso} usa a conta Google e está disponível para quem se cadastrou no Portal com o Google.`}
    />
  );
}
