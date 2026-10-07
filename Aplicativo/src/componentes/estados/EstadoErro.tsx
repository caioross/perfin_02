type Props = { mensagem?: string; children?: React.ReactNode };

export default function EstadoErro({ mensagem = "Não foi possível carregar os dados. Tente novamente em instantes.", children }: Props) {
  return (
    <div role="alert" className="space-y-3 rounded-xl border border-alerta/40 bg-alerta-suave p-4 text-sm text-alerta">
      <p>{mensagem}</p>
      {children}
    </div>
  );
}
