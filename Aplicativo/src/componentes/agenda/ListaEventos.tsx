import EstadoVazio from "@/componentes/estados/EstadoVazio";
import type { EventoAgenda } from "@/tipos/google";

type Props = { eventos: EventoAgenda[] };

const FUSO = "America/Sao_Paulo";

function rotuloDia(evento: EventoAgenda): string {
  const data = evento.diaInteiro ? new Date(`${evento.inicio}T12:00:00Z`) : new Date(evento.inicio);
  const texto = data.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: evento.diaInteiro ? "UTC" : FUSO });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function horario(evento: EventoAgenda): string {
  if (evento.diaInteiro) return "Dia inteiro";
  const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: FUSO });
  return evento.fim ? `${hora(evento.inicio)} – ${hora(evento.fim)}` : hora(evento.inicio);
}

export default function ListaEventos({ eventos }: Props) {
  if (eventos.length === 0) {
    return <EstadoVazio titulo="Nenhuma reunião nos próximos 14 dias" />;
  }
  const porDia = Map.groupBy(eventos, rotuloDia);
  return (
    <div className="space-y-5">
      {[...porDia.entries()].map(([dia, doDia]) => (
        <section key={dia} aria-label={dia} className="space-y-2">
          <h2 className="text-sm font-semibold text-texto-suave">{dia}</h2>
          <ul className="space-y-2">
            {doDia.map((e) => (
              <li key={e.id} className="flex flex-col gap-1 rounded-xl border border-borda bg-superficie p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{e.titulo}</p>
                  <p className="numero text-sm text-texto-suave">{horario(e)}{e.local ? ` · ${e.local}` : ""}</p>
                </div>
                <div className="flex gap-2 text-sm">
                  {e.linkReuniao && <a href={e.linkReuniao} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-marca px-3 py-1.5 text-white hover:bg-marca-forte">Entrar na reunião</a>}
                  {e.linkEvento && <a href={e.linkEvento} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-borda px-3 py-1.5 hover:bg-superficie-2">Abrir na Agenda</a>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
