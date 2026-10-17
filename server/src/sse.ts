import type { Response } from "express";

/**
 * Hub de Server-Sent Events agrupado por partido.
 * Cada suscriptor solo recibe los mensajes del partido al que se conectó.
 */
interface Subscriber {
  res: Response;
  /** Mientras se reenvía el historial perdido, los mensajes en vivo se encolan aquí. */
  pending: SseMessage[] | null;
}

export interface SseMessage {
  event: string;
  data: unknown;
  id?: number;
}

const subscribers = new Map<number, Set<Subscriber>>();

function write(res: Response, msg: SseMessage) {
  let chunk = "";
  if (msg.id !== undefined) chunk += `id: ${msg.id}\n`;
  chunk += `event: ${msg.event}\n`;
  chunk += `data: ${JSON.stringify(msg.data)}\n\n`;
  res.write(chunk);
}

export function openStream(res: Response) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  // Tiempo que espera EventSource antes de reconectar.
  res.write("retry: 3000\n\n");
}

/** Registra la conexión en estado "pendiente" (encola mensajes hasta llamar a `ready`). */
export function subscribe(matchId: number, res: Response) {
  const sub: Subscriber = { res, pending: [] };
  let set = subscribers.get(matchId);
  if (!set) subscribers.set(matchId, (set = new Set()));
  set.add(sub);

  return {
    send: (msg: SseMessage) => write(res, msg),
    /** Vacía la cola omitiendo los eventos ya enviados durante el reenvío. */
    ready(alreadySent: Set<number>) {
      const queued = sub.pending ?? [];
      sub.pending = null;
      for (const msg of queued) {
        if (msg.id !== undefined && alreadySent.has(msg.id)) continue;
        write(res, msg);
      }
    },
    unsubscribe() {
      set.delete(sub);
      if (set.size === 0) subscribers.delete(matchId);
    },
  };
}

export function broadcast(matchId: number, msg: SseMessage) {
  for (const sub of subscribers.get(matchId) ?? []) {
    if (sub.pending) sub.pending.push(msg);
    else write(sub.res, msg);
  }
}

export function connectionStats() {
  return Object.fromEntries([...subscribers].map(([id, set]) => [id, set.size]));
}

// Comentario SSE periódico para que proxies no cierren conexiones inactivas.
setInterval(() => {
  for (const set of subscribers.values()) for (const sub of set) sub.res.write(": ping\n\n");
}, 15_000).unref();
