export const EVENT_TYPES = ["goal", "foul", "substitution", "yellow_card", "red_card"] as const;
export const MATCH_STATUSES = ["scheduled", "live", "halftime", "finished"] as const;
export const TEAM_SIDES = ["home", "away"] as const;

export type EventType = (typeof EVENT_TYPES)[number];
export type MatchStatus = (typeof MATCH_STATUSES)[number];
export type TeamSide = (typeof TEAM_SIDES)[number];

/** Partido tal como viaja por HTTP/SSE (fechas en ISO). */
export interface MatchDTO {
  id: number;
  homeTeam: string;
  awayTeam: string;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  venue: string | null;
  createdAt: string;
}

export interface MatchEventDTO {
  id: number;
  matchId: number;
  type: EventType;
  minute: number;
  team: TeamSide;
  player: string | null;
  playerIn: string | null;
  description: string | null;
  createdAt: string;
}

/** Respuesta de GET /api/matches/:id: estado actual + historial. */
export interface MatchDetailDTO {
  match: MatchDTO;
  events: MatchEventDTO[];
}

/** Payload del mensaje SSE `match-event`: el evento y el partido actualizado (marcador). */
export interface StreamEventPayload {
  event: MatchEventDTO;
  match: MatchDTO;
}

export const PLAYER_POSITIONS = ["goalkeeper", "defender", "midfielder", "forward"] as const;
export type PlayerPosition = (typeof PLAYER_POSITIONS)[number];

export interface PlayerDTO {
  id: number;
  team: string;
  name: string;
  shirtNumber: number | null;
  position: PlayerPosition | null;
}

/** Respuesta de GET /api/matches/:id/players: plantilla de cada equipo. */
export interface MatchPlayersDTO {
  home: PlayerDTO[];
  away: PlayerDTO[];
}

/** Orden de la línea de tiempo: minuto y luego fecha de creación (id como desempate). */
export function compareEvents(a: MatchEventDTO, b: MatchEventDTO): number {
  return a.minute - b.minute || a.createdAt.localeCompare(b.createdAt) || a.id - b.id;
}
