import { db, pool } from "./db";
import { matches, players } from "./db/schema";
import { ROSTERS } from "./rosters";

// Datos de ejemplo insertados con el ORM. La estructura de la BD solo la cambian las migraciones.
const existing = await db.select({ id: matches.id }).from(matches).limit(1);
if (existing.length > 0) {
  console.log("Ya hay partidos registrados; no se insertan partidos de ejemplo.");
} else {
  await db.insert(matches).values([
    { homeTeam: "Barcelona", awayTeam: "Real Madrid", status: "live", venue: "Spotify Camp Nou" },
    { homeTeam: "Boca Juniors", awayTeam: "River Plate", status: "scheduled", venue: "La Bombonera" },
    { homeTeam: "América", awayTeam: "Chivas", status: "scheduled", venue: "Estadio Azteca" },
  ]);
  console.log("Partidos de ejemplo creados.");
}

// Plantillas: se insertan las que falten (se puede ejecutar varias veces).
const rows = Object.entries(ROSTERS).flatMap(([team, entries]) =>
  entries.map(([shirtNumber, name, position]) => ({ team, name, shirtNumber, position })),
);
const inserted = await db.insert(players).values(rows).onConflictDoNothing().returning({ id: players.id });
console.log(`Jugadores: ${inserted.length} nuevos (${rows.length} en las plantillas).`);

await pool.end();
