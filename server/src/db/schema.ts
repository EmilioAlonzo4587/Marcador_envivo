import { pgEnum, pgTable, serial, integer, text, timestamp, index, unique } from "drizzle-orm/pg-core";

export const matchStatus = pgEnum("match_status", ["scheduled", "live", "halftime", "finished"]);
// v2 (0001): se agregan las tarjetas amarilla y roja.
export const eventType = pgEnum("event_type", ["goal", "foul", "substitution", "yellow_card", "red_card"]);
export const teamSide = pgEnum("team_side", ["home", "away"]);

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  status: matchStatus("status").notNull().default("scheduled"),
  homeScore: integer("home_score").notNull().default(0),
  awayScore: integer("away_score").notNull().default(0),
  // v2 (0001): estadio del partido.
  venue: text("venue"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const matchEvents = pgTable(
  "match_events",
  {
    id: serial("id").primaryKey(),
    matchId: integer("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    type: eventType("type").notNull(),
    minute: integer("minute").notNull(),
    team: teamSide("team").notNull(),
    // En un cambio, `player` es el jugador que sale.
    player: text("player"),
    // v2 (0001): jugador que entra en un cambio.
    playerIn: text("player_in"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // v2 (0001): índice para leer la línea de tiempo de un partido en orden.
  (t) => [index("match_events_timeline_idx").on(t.matchId, t.minute, t.createdAt)],
);

// v3 (0002): plantillas reales de cada equipo.
export const playerPosition = pgEnum("player_position", ["goalkeeper", "defender", "midfielder", "forward"]);

export const players = pgTable(
  "players",
  {
    id: serial("id").primaryKey(),
    // Mismo nombre que matches.home_team / matches.away_team.
    team: text("team").notNull(),
    name: text("name").notNull(),
    shirtNumber: integer("shirt_number"),
    position: playerPosition("position"),
  },
  (t) => [unique("players_team_name_unique").on(t.team, t.name), index("players_team_idx").on(t.team)],
);

export type Match = typeof matches.$inferSelect;
export type MatchEvent = typeof matchEvents.$inferSelect;
export type Player = typeof players.$inferSelect;
