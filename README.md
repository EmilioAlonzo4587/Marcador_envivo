# ⚽ Fútbol Sin Fronteras — marcador en vivo

Aplicación web que muestra eventos de partidos de fútbol en tiempo real usando **Server-Sent Events (SSE)**, con una base de datos **PostgreSQL** versionada mediante **migraciones de Drizzle ORM**.

- **Vista pública**: seleccionar un partido y ver su marcador y su línea de tiempo en vivo.
- **Vista de administración**: seleccionar un partido, cambiar su estado y registrar eventos con un formulario validado.

## Tecnologías

| Capa | Herramienta |
| --- | --- |
| Lenguaje | TypeScript (cliente, servidor y código compartido) |
| Backend | Node.js + Express |
| Frontend | React + Vite |
| Base de datos | PostgreSQL 16 (Docker) |
| ORM / migraciones | Drizzle ORM + drizzle-kit |
| Validación | Zod (el mismo esquema en navegador y servidor) |

## Puesta en marcha

Requisitos: Node.js 20+ y Docker.

```bash
npm install
cp .env.example .env        # DATABASE_URL apunta al Postgres de docker-compose (puerto 5433)
npm run db:up               # levanta PostgreSQL en Docker
npm run db:migrate          # aplica las migraciones de ./drizzle
npm run db:seed             # inserta 3 partidos de ejemplo y las plantillas reales
npm run dev                 # API en :3000 y frontend en :5173
```

Abrir <http://localhost:5173>.

- Vista pública: `http://localhost:5173/#/partido/1`
- Administración: `http://localhost:5173/#/admin/1`

## Migraciones

Los archivos están versionados en [`drizzle/`](drizzle/):

| Archivo | Contenido |
| --- | --- |
| `0000_initial.sql` | Migración inicial: enums `match_status`, `event_type` (`goal`, `foul`, `substitution`) y `team_side`; tablas `matches` y `match_events` con clave foránea. |
| `0001_cards_venue_player_in.sql` | Evolución del esquema: agrega `yellow_card` y `red_card` al enum de eventos, la columna `match_events.player_in` (jugador que entra en un cambio), la columna `matches.venue` (estadio) y el índice `match_events_timeline_idx (match_id, minute, created_at)` para la línea de tiempo. |
| `0002_players.sql` | Agrega el enum `player_position` y la tabla `players` (equipo, nombre, dorsal, posición) con restricción única `(team, name)`, para guardar las plantillas. |

El esquema fuente está en [`server/src/db/schema.ts`](server/src/db/schema.ts).

```bash
# 1. Editar server/src/db/schema.ts
# 2. Generar una nueva migración versionada a partir de las diferencias
npm run db:generate -- --name nombre_del_cambio
# 3. Aplicar las migraciones pendientes a la base de datos
npm run db:migrate
```

`drizzle-kit migrate` registra las migraciones aplicadas en la tabla `drizzle.__drizzle_migrations`, así que solo ejecuta las que faltan. La estructura de la base de datos no se modifica a mano en ningún paso; el seed solo inserta datos mediante el ORM.

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/matches` | Lista de partidos |
| GET | `/api/matches/:id` | Estado actual + historial de eventos ordenado (carga inicial) |
| GET | `/api/matches/:id/players` | Plantilla del equipo local y del visitante |
| POST | `/api/matches/:id/events` | Registra un evento (validado). Responde `201` o `422` con errores por campo |
| PATCH | `/api/matches/:id` | Cambia el estado del partido (`scheduled`, `live`, `halftime`, `finished`) |
| GET | `/api/matches/:id/events/stream` | Stream SSE (`text/event-stream`) del partido |
| GET | `/api/debug/connections` | Conexiones SSE abiertas por partido (sirve para verificar la limpieza) |

Mensajes SSE:

- `event: match-event` con `id: <id del evento>` → `{ event, match }` (el evento nuevo y el marcador actualizado).
- `event: match` → el partido actualizado (cambio de estado, o el estado actual al conectar).
- `: ping` cada 15 s para mantener viva la conexión.

## Cómo se cumple cada requerimiento

### 1. Partidos y eventos
- `matches` guarda equipo local, visitante, estado, marcador (`home_score`, `away_score`) y estadio.
- `match_events` guarda goles, faltas, cambios, tarjetas amarillas y rojas.
- Cada tipo tiene icono y color propios ([`labels.ts`](client/src/labels.ts), [`Timeline.tsx`](client/src/components/Timeline.tsx)): ⚽ verde, 🚫 naranja, 🔄 azul, y tarjetas dibujadas en amarillo o rojo. Los eventos del local aparecen a la izquierda y los del visitante a la derecha.
- La línea de tiempo se ordena por `minute`, luego `created_at` (y `id` como desempate), tanto en SQL como en el cliente (`compareEvents`).

### Plantillas reales
Los seis equipos tienen sus plantillas reales de la temporada 2026-27 (Europa) y del segundo semestre de 2026 (Argentina y México), consultadas en octubre de 2026. Están en [`server/src/rosters.ts`](server/src/rosters.ts), con las fuentes indicadas en el archivo. El formulario de administración muestra la plantilla del equipo elegido, agrupada por posición y con dorsal. El servidor rechaza con `422` cualquier jugador que no pertenezca a ese equipo. En América los dorsales quedan vacíos porque la fuente no los publica. Para actualizar una plantilla, se edita ese archivo y se vuelve a ejecutar `npm run db:seed`, que solo inserta los jugadores que falten.

### 2. Administración
- Selector de partido y formulario ([`EventForm.tsx`](client/src/components/EventForm.tsx)) validado con Zod en el navegador. El servidor vuelve a validar con el mismo esquema ([`shared/validation.ts`](shared/validation.ts)): minuto entre 0 y 130, equipo obligatorio, autor obligatorio en los goles, y jugador que sale y que entra en los cambios.
- Los eventos se envían con `POST`, y el cambio de estado con `PATCH`.
- En [`routes.ts`](server/src/routes.ts) el evento se inserta, y el marcador se actualiza si es gol, **dentro de una transacción**. La transmisión SSE ocurre solo **después** del commit.

### 3. Actualizaciones con SSE
- `GET /api/matches/:id/events/stream` responde con `Content-Type: text/event-stream`.
- El navegador usa `EventSource` ([`useMatchStream.ts`](client/src/useMatchStream.ts)).
- El hub ([`sse.ts`](server/src/sse.ts)) agrupa las conexiones por partido, así que un evento solo se escribe en las conexiones de su partido.
- El estado de la conexión se muestra como *Conectando*, *Conectado*, *Reconectando* o *Desconectado* (con botón de reintento).
- El `cleanup` del `useEffect` llama a `source.close()` al cambiar de partido o salir de la vista. En el servidor, `req.on("close")` elimina al suscriptor. Se puede comprobar en `/api/debug/connections`.
- No hay polling: después de la carga inicial, todo llega por SSE.

### 4. Persistencia y migraciones
Ver la sección [Migraciones](#migraciones).

### 5. Recuperación del estado
1. **Carga inicial por HTTP**: `GET /api/matches/:id` devuelve el marcador y todo el historial desde la base de datos.
2. **Después** se abre el `EventSource` con `?lastEventId=<último id cargado>`, y el servidor reenvía lo que se haya registrado entre la carga y la conexión.
3. **Al recargar el navegador**, el partido seleccionado está en la URL (`#/partido/1`) y todo se vuelve a leer de la base de datos, así que el marcador y la línea de tiempo se conservan.
4. **Sin duplicados al reconectar**:
   - Cada mensaje lleva `id:`. Al reconectar, `EventSource` envía `Last-Event-ID` y el servidor solo reenvía los eventos con id mayor.
   - El servidor suscribe la conexión *antes* de consultar los eventos perdidos y encola los mensajes en vivo hasta terminar el reenvío, descartando los que ya envió.
   - El cliente guarda un `Set` con los ids que ya mostró e ignora cualquier repetido.
5. **Aislamiento entre partidos**: ver la demostración siguiente.

## Demostración

### Automática
Con el servidor corriendo (`npm run dev` o `npm run dev:server`):

```bash
npm run demo:isolation
```

```
✔ Ambos streams responden con Content-Type text/event-stream
✔ POST a Barcelona vs Real Madrid → 201 (evento #1)
✔ El stream del partido 1 recibió el evento #1
✔ El stream del partido 2 NO recibió nada (0 eventos)
✔ Al reconectar con Last-Event-ID no se reenvía el evento ya recibido
✔ Al reconectar desde #0 se reenvía solo lo perdido: [1]
✔ Conexiones limpiadas en el servidor: {}
```

El script registra una falta de prueba en el primer partido.

### Manual
1. Abrir `#/partido/1` en una pestaña y `#/partido/2` en otra.
2. En una tercera pestaña abrir `#/admin/1` y registrar un gol.
3. La pestaña del partido 1 actualiza el marcador al instante. La del partido 2 no cambia.
4. Recargar la pestaña del partido 1: el marcador y la línea de tiempo siguen ahí.
5. Detener la API (o reiniciarla): el indicador pasa a *Reconectando*. Al volver a levantarla pasa a *Conectado* y la línea de tiempo no muestra eventos duplicados.

## Estructura

```
├── docker-compose.yml        PostgreSQL
├── drizzle.config.ts         configuración de drizzle-kit
├── drizzle/                  migraciones versionadas (SQL + meta)
├── shared/                   tipos y validación compartidos
├── server/src/
│   ├── db/schema.ts          esquema Drizzle
│   ├── db/index.ts           conexión
│   ├── routes.ts             endpoints HTTP + SSE
│   ├── sse.ts                hub de conexiones por partido
│   └── seed.ts               datos de ejemplo
├── client/src/
│   ├── useMatchStream.ts     carga inicial + EventSource + deduplicación
│   ├── components/           marcador, línea de tiempo, formulario…
│   └── App.tsx
└── scripts/demo-isolation.ts demostración automática
```
