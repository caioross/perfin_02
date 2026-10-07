type Props = { titulo: string; descricao?: string };

export default function EstadoVazio({ titulo, descricao }: Props) {
  return (
    <div className="rounded-xl border border-dashed border-borda p-6 text-center">
      <p className="font-medium">{titulo}</p>
      {descricao && <p className="mt-1 text-sm text-texto-suave">{descricao}</p>}
    </div>
  );
}
