import { useEffect, useState } from "react";
import type { MatchDTO } from "../../shared/types";
import { api } from "./api";
import { useHashRoute } from "./useHashRoute";
import { useMatchStream } from "./useMatchStream";
import { MatchSelector } from "./components/MatchSelector";
import { Scoreboard } from "./components/Scoreboard";
import { Legend, Timeline } from "./components/Timeline";
import { ConnectionBadge } from "./components/ConnectionBadge";
import { EventForm } from "./components/EventForm";
import { StatusControls } from "./components/StatusControls";
import { IconBall, IconTrophy, Logo } from "./components/Icons";

export function App() {
  const { route, navigate } = useHashRoute();
  const [matches, setMatches] = useState<MatchDTO[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const { match, events, connection, error, reconnect } = useMatchStream(route.matchId);

  useEffect(() => {
    api.listMatches().then(setMatches, (e: Error) => setListError(e.message));
  }, []);

  // Sin partido en la URL: seleccionar el primero.
  useEffect(() => {
    if (route.matchId === null && matches.length > 0) navigate({ ...route, matchId: matches[0].id });
  }, [route, matches]);

  // Mantener la lista (estado/marcador) al día con lo que llega por SSE del partido abierto.
  useEffect(() => {
    if (match) setMatches((list) => list.map((m) => (m.id === match.id ? match : m)));
  }, [match]);

  const isAdmin = route.view === "admin";

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#/partido">
          <Logo />
          <span className="brand-text">
            <span className="brand-name">
              Fútbol <em>Sin Fronteras</em>
            </span>
            <span className="brand-tag">Marcadores en vivo · minuto a minuto</span>
          </span>
        </a>
        <div className="tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!isAdmin}
            className={!isAdmin ? "active" : ""}
            onClick={() => navigate({ ...route, view: "public" })}
          >
            Vista pública
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isAdmin}
            className={isAdmin ? "active" : ""}
            onClick={() => navigate({ ...route, view: "admin" })}
          >
            Administración
          </button>
        </div>
      </header>

      <div className="section-head">
        <h2 className="section-title">
          <IconTrophy size={18} /> Partidos
        </h2>
        <ConnectionBadge state={connection} onReconnect={reconnect} />
      </div>

      {listError && <p className="form-error">No se pudieron cargar los partidos: {listError}</p>}
      <MatchSelector
        matches={matches}
        selectedId={route.matchId}
        onSelect={(id) => navigate({ ...route, matchId: id })}
      />

      {error && <p className="form-error">{error}</p>}
      {!match && !error && route.matchId !== null && <p className="loading">Cargando partido…</p>}

      {match && (
        <main className={isAdmin ? "layout-admin" : "layout-public"}>
          {isAdmin && (
            <aside className="panel panel-admin">
              <StatusControls match={match} />
              <EventForm key={match.id} match={match} />
            </aside>
          )}
          <section className="match-view">
            <Scoreboard match={match} events={events} />
            <div className="panel pitch">
              <div className="timeline-head">
                <h2 className="section-title">
                  <IconBall size={18} /> Minuto a minuto
                </h2>
                <Legend />
              </div>
              <Timeline events={events} match={match} />
            </div>
          </section>
        </main>
      )}

      <footer className="footer">Fútbol Sin Fronteras · Datos en tiempo real con Server-Sent Events</footer>
    </div>
  );
}
