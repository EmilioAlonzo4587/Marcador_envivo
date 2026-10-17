import { useEffect, useState } from "react";
import { api } from "./api";
import { compareEvents, type MatchDTO, type MatchEventDTO, type StreamEventPayload } from "../../shared/types";

export type ConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected";

/**
 * 1. Carga el estado y el historial del partido por HTTP.
 * 2. Después abre un EventSource para recibir solo los eventos nuevos de ese partido.
 * 3. Cierra la conexión al cambiar de partido o desmontar la vista.
 */
export function useMatchStream(matchId: number | null) {
  const [match, setMatch] = useState<MatchDTO | null>(null);
  const [events, setEvents] = useState<MatchEventDTO[]>([]);
  const [connection, setConnection] = useState<ConnectionState>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (matchId === null) return;
    let cancelled = false;
    let source: EventSource | null = null;
    // Ids ya mostrados: evita duplicados tras una reconexión o un reenvío del servidor.
    const seen = new Set<number>();

    setMatch(null);
    setEvents([]);
    setError(null);
    setConnection("connecting");

    api
      .getMatch(matchId)
      .then((detail) => {
        if (cancelled) return;
        for (const e of detail.events) seen.add(e.id);
        setMatch(detail.match);
        setEvents(detail.events);

        const lastEventId = detail.events.reduce((max, e) => Math.max(max, e.id), 0);
        source = new EventSource(api.streamUrl(matchId, lastEventId));

        source.onopen = () => setConnection("connected");
        source.onerror = () => {
          // CONNECTING = el navegador reintentará solo; CLOSED = se rindió.
          setConnection(source?.readyState === EventSource.CLOSED ? "disconnected" : "reconnecting");
        };
        source.addEventListener("match-event", (msg) => {
          const payload = JSON.parse(msg.data) as StreamEventPayload;
          if (payload.event.matchId !== matchId) return;
          setMatch(payload.match);
          if (seen.has(payload.event.id)) return;
          seen.add(payload.event.id);
          setEvents((prev) => [...prev, payload.event].sort(compareEvents));
        });
        source.addEventListener("match", (msg) => {
          const updated = JSON.parse(msg.data) as MatchDTO;
          if (updated.id === matchId) setMatch(updated);
        });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setConnection("disconnected");
      });

    return () => {
      cancelled = true;
      source?.close();
      setConnection("disconnected");
    };
  }, [matchId, attempt]);

  return { match, events, connection, error, reconnect: () => setAttempt((n) => n + 1) };
}
