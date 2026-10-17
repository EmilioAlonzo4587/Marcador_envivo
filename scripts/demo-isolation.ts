/**
 * Demostración automática (requiere el servidor corriendo: npm run dev:server).
 *  1. Abre dos streams SSE: partido A y partido B.
 *  2. Registra un evento en A por POST.
 *  3. Comprueba que A lo recibe y B NO.
 *  4. Reconecta a A con Last-Event-ID y comprueba que no se reenvía el evento ya recibido.
 */
const BASE = process.env.API_URL ?? "http://localhost:3000/api";

interface Received {
  event: string;
  id?: string;
  data: any;
}

function openStream(matchId: number, headers: Record<string, string> = {}) {
  const controller = new AbortController();
  const received: Received[] = [];
  const opened = fetch(`${BASE}/matches/${matchId}/events/stream`, { headers, signal: controller.signal }).then(
    async (res) => {
      if (res.headers.get("content-type")?.startsWith("text/event-stream") !== true) {
        throw new Error(`Content-Type inesperado: ${res.headers.get("content-type")}`);
      }
      const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      (async () => {
        try {
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += value;
            let idx;
            while ((idx = buffer.indexOf("\n\n")) >= 0) {
              const block = buffer.slice(0, idx);
              buffer = buffer.slice(idx + 2);
              const msg: Received = { event: "message", data: "" };
              for (const line of block.split("\n")) {
                if (line.startsWith("event: ")) msg.event = line.slice(7);
                else if (line.startsWith("id: ")) msg.id = line.slice(4);
                else if (line.startsWith("data: ")) msg.data = JSON.parse(line.slice(6));
              }
              if (msg.data !== "") received.push(msg);
            }
          }
        } catch {
          /* abortado */
        }
      })();
    },
  );
  return { received, opened, close: () => controller.abort() };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const matchEvents = (r: Received[]) => r.filter((m) => m.event === "match-event");
let failures = 0;
function check(ok: boolean, label: string) {
  console.log(`${ok ? "✔" : "✘"} ${label}`);
  if (!ok) failures++;
}

const matches = await (await fetch(`${BASE}/matches`)).json();
if (matches.length < 2) throw new Error("Se necesitan al menos dos partidos (npm run db:seed)");
const [a, b] = matches;
const roster = await (await fetch(`${BASE}/matches/${a.id}/players`)).json();
const player: string | undefined = roster.home[0]?.name;

// Arrancamos después del último evento existente para ver solo lo nuevo.
const lastA = Math.max(0, ...(await (await fetch(`${BASE}/matches/${a.id}`)).json()).events.map((e: any) => e.id));
const lastB = Math.max(0, ...(await (await fetch(`${BASE}/matches/${b.id}`)).json()).events.map((e: any) => e.id));

const streamA = openStream(a.id, { "Last-Event-ID": String(lastA) });
const streamB = openStream(b.id, { "Last-Event-ID": String(lastB) });
await Promise.all([streamA.opened, streamB.opened]);
check(true, "Ambos streams responden con Content-Type text/event-stream");
await wait(300);

const res = await fetch(`${BASE}/matches/${a.id}/events`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ type: "foul", minute: 42, team: "home", player, description: "Prueba de aislamiento" }),
});
const created = await res.json();
check(res.status === 201, `POST a ${a.homeTeam} vs ${a.awayTeam} → 201 (evento #${created.event?.id})`);
await wait(500);

const gotA = matchEvents(streamA.received).map((m) => m.data.event.id);
const gotB = matchEvents(streamB.received).map((m) => m.data.event.id);
check(gotA.includes(created.event.id), `El stream del partido ${a.id} recibió el evento #${created.event.id}`);
check(!gotB.includes(created.event.id) && gotB.length === 0, `El stream del partido ${b.id} NO recibió nada (${gotB.length} eventos)`);
streamA.close();
streamB.close();

// Reconexión: el navegador envía Last-Event-ID con el último id recibido.
const again = openStream(a.id, { "Last-Event-ID": String(created.event.id) });
await again.opened;
await wait(400);
check(matchEvents(again.received).length === 0, "Al reconectar con Last-Event-ID no se reenvía el evento ya recibido");
again.close();

// Reconexión con un id anterior: se reenvía solo lo que faltó.
const replay = openStream(a.id, { "Last-Event-ID": String(lastA) });
await replay.opened;
await wait(400);
const replayed = matchEvents(replay.received).map((m) => m.data.event.id);
check(
  replayed.length === 1 && replayed[0] === created.event.id,
  `Al reconectar desde #${lastA} se reenvía solo lo perdido: [${replayed.join(", ")}]`,
);
replay.close();

await wait(200);
const conns = await (await fetch(`${BASE}/debug/connections`)).json();
check(Object.keys(conns).length === 0, `Conexiones limpiadas en el servidor: ${JSON.stringify(conns)}`);

console.log(failures === 0 ? "\nTodo correcto." : `\n${failures} comprobación(es) fallaron.`);
process.exit(failures === 0 ? 0 : 1);

export {};
