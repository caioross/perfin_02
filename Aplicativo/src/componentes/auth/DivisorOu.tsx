// Separador "ou" entre o login Google e o formulário de e-mail.
export default function DivisorOu() {
  return (
    <div className="flex items-center gap-3 text-xs text-texto-suave" role="separator" aria-label="ou">
      <span className="h-px flex-1 bg-borda" />
      ou
      <span className="h-px flex-1 bg-borda" />
    </div>
  );
}
