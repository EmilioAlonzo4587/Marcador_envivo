import { Router, type Request, type Response } from "express";
import { and, asc, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import { matches, matchEvents, players } from "./db/schema";
import { toEventDTO, toMatchDTO } from "./dto";
import { broadcast, connectionStats, openStream, subscribe } from "./sse";
import { createEventSchema, fieldErrors, updateMatchSchema } from "../../shared/validation";
import type { MatchDetailDTO, MatchPlayersDTO, StreamEventPayload } from "../../shared/types";

export const router = Router();

const timelineOrder = [asc(matchEvents.minute), asc(matchEvents.createdAt), asc(matchEvents.id)];

function parseId(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Id de partido inválido" });
    return null;
  }
  return id;
}

async function findMatch(id: number) {
  const [match] = await db.select().from(matches).where(eq(matches.id, id));
  return match;
}

router.get("/matches", async (_req, res) => {
  const rows = await db.select().from(matches).orderBy(asc(matches.id));
  res.json(rows.map(toMatchDTO));
});

/** Carga inicial: estado actual del partido + historial completo desde la BD. */
router.get("/matches/:id", async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const match = await findMatch(id);
  if (!match) return void res.status(404).json({ error: "Partido no encontrado" });

  const events = await db
    .select()
    .from(matchEvents)
    .where(eq(matchEvents.matchId, id))
    .orderBy(...timelineOrder);
  const body: MatchDetailDTO = { match: toMatchDTO(match), events: events.map(toEventDTO) };
  res.json(body);
});

/** Plantillas de los dos equipos del partido. */
router.get("/matches/:id/players", async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const match = await findMatch(id);
  if (!match) return void res.status(404).json({ error: "Partido no encontrado" });

  const rows = await db
    .select()
    .from(players)
    .where(inArray(players.team, [match.homeTeam, match.awayTeam]))
    .orderBy(asc(players.shirtNumber), asc(players.name));
  const body: MatchPlayersDTO = {
    home: rows.filter((p) => p.team === match.homeTeam),
    away: rows.filter((p) => p.team === match.awayTeam),
  };
  res.json(body);
});

/** Registrar un evento: se valida, se guarda (y actualiza el marcador) y DESPUÉS se transmite. */
router.post("/matches/:id/events", async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const parsed = createEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return void res.status(422).json({ error: "Datos inválidos", fields: fieldErrors(parsed.error) });
  }

  const result = await db.transaction(async (tx) => {
    const [match] = await tx.select().from(matches).where(eq(matches.id, id)).for("update");
    if (!match) return null;

    // Si el equipo tiene plantilla registrada, los jugadores deben pertenecer a ella.
    const team = parsed.data.team === "home" ? match.homeTeam : match.awayTeam;
    const roster = new Set(
      (await tx.select({ name: players.name }).from(players).where(eq(players.team, team))).map((p) => p.name),
    );
    if (roster.size > 0) {
      const fields: Record<string, string> = {};
      for (const field of ["player", "playerIn"] as const) {
        const name = parsed.data[field];
        if (name && !roster.has(name)) fields[field] = `${name} no pertenece a la plantilla de ${team}`;
      }
      if (Object.keys(fields).length > 0) return { invalid: fields };
    }

    const [event] = await tx
      .insert(matchEvents)
      .values({ matchId: id, ...parsed.data })
      .returning();

    let updated = match;
    if (event.type === "goal") {
      const score =
        event.team === "home"
          ? { homeScore: sql`${matches.homeScore} + 1` }
          : { awayScore: sql`${matches.awayScore} + 1` };
      [updated] = await tx.update(matches).set(score).where(eq(matches.id, id)).returning();
    }
    return { event, match: updated };
  });

  if (!result) return void res.status(404).json({ error: "Partido no encontrado" });
  if ("invalid" in result) return void res.status(422).json({ error: "Datos inválidos", fields: result.invalid });

  // La transacción ya se confirmó: ahora sí se notifica solo a los espectadores de este partido.
  const payload: StreamEventPayload = { event: toEventDTO(result.event), match: toMatchDTO(result.match) };
  broadcast(id, { event: "match-event", id: result.event.id, data: payload });
  res.status(201).json(payload);
});

/** Cambiar el estado del partido (programado, en vivo, descanso, finalizado). */
router.patch("/matches/:id", async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const parsed = updateMatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return void res.status(422).json({ error: "Datos inválidos", fields: fieldErrors(parsed.error) });
  }

  const [match] = await db.update(matches).set(parsed.data).where(eq(matches.id, id)).returning();
  if (!match) return void res.status(404).json({ error: "Partido no encontrado" });

  const dto = toMatchDTO(match);
  broadcast(id, { event: "match", data: dto });
  res.json(dto);
});

/**
 * Stream SSE de un partido. Al reconectar, EventSource envía `Last-Event-ID`
 * (y tras la carga inicial el cliente pasa `?lastEventId=`): se reenvían
 * solo los eventos de ESTE partido con id mayor.
 */
router.get("/matches/:id/events/stream", async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  if (!(await findMatch(id))) return void res.status(404).json({ error: "Partido no encontrado" });

  const rawLast = req.header("last-event-id") ?? (req.query.lastEventId as string | undefined) ?? "0";
  const lastEventId = Math.max(0, Number.parseInt(rawLast, 10) || 0);

  openStream(res);
  // Suscribir antes de consultar evita perder eventos que lleguen durante el reenvío.
  const stream = subscribe(id, res);
  res.on("close", () => stream.unsubscribe());

  const missed = await db
    .select()
    .from(matchEvents)
    .where(and(eq(matchEvents.matchId, id), gt(matchEvents.id, lastEventId)))
    .orderBy(asc(matchEvents.id));
  const current = toMatchDTO((await findMatch(id))!);

  const sent = new Set<number>();
  for (const event of missed) {
    const payload: StreamEventPayload = { event: toEventDTO(event), match: current };
    stream.send({ event: "match-event", id: event.id, data: payload });
    sent.add(event.id);
  }
  stream.send({ event: "match", data: current });
  stream.ready(sent);
});

/** Diagnóstico: conexiones SSE abiertas por partido (sirve para verificar la limpieza). */
router.get("/debug/connections", (_req, res) => {
  res.json(connectionStats());
});
