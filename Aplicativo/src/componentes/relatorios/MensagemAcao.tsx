import type { EstadoRelatorio } from "@/app/(portal)/relatorios/acoes";
import BotaoEntrarGoogle from "@/componentes/auth/BotaoEntrarGoogle";

// Resultado de uma ação de relatório: sucesso, erro ou pedido de reconexão com o Google.
export default function MensagemAcao({ estado }: { estado: EstadoRelatorio }) {
  return (
    <div aria-live="polite" className="space-y-2">
      {estado.sucesso && <p className="text-sm text-positivo">{estado.sucesso}</p>}
      {estado.erro && <p role="alert" className="text-sm text-alerta">{estado.erro}</p>}
      {estado.reconectar && <BotaoEntrarGoogle rotulo="Reconectar conta Google" />}
    </div>
  );
}
