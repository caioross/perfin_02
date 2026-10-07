import "server-only";
import type { EventoAgenda } from "@/tipos/google";
import { requisicaoGoogleJson } from "./cliente";

const URL_EVENTOS = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

type EventoGoogle = {
  id: string;
  summary?: string;
  location?: string;
  htmlLink?: string;
  hangoutLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

function linkSeguro(url: string | undefined): string | null {
  return url && url.startsWith("https://") ? url : null;
}

function converter(evento: EventoGoogle): EventoAgenda | null {
  const inicio = evento.start?.dateTime ?? evento.start?.date;
  if (!inicio) return null;
  return {
    id: evento.id,
    titulo: evento.summary?.trim() || "(sem título)",
    inicio,
    fim: evento.end?.dateTime ?? evento.end?.date ?? null,
    diaInteiro: !evento.start?.dateTime,
    local: evento.location ?? null,
    linkReuniao: linkSeguro(evento.hangoutLink),
    linkEvento: linkSeguro(evento.htmlLink),
  };
}

// Próximas reuniões do calendário principal (somente leitura: calendar.events.readonly).
export async function listarProximosEventos(
  accessToken: string,
  agora: Date,
  dias = 14,
  limite = 15,
): Promise<EventoAgenda[]> {
  const fim = new Date(agora.getTime() + dias * 24 * 60 * 60 * 1000);
  const busca = new URLSearchParams({
    timeMin: agora.toISOString(),
    timeMax: fim.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: String(limite),
  });
  const corpo = await requisicaoGoogleJson<{ items?: EventoGoogle[] }>(accessToken, `${URL_EVENTOS}?${busca}`);
  return (corpo.items ?? []).map(converter).filter((e): e is EventoAgenda => e !== null);
}
