import { EVENT_TYPES, type MatchDTO, type MatchEventDTO } from "../../../shared/types";
import { EVENT_META } from "../labels";
import { TeamCrest } from "./TeamCrest";

function EventItem({ event, match }: { event: MatchEventDTO; match: MatchDTO }) {
  const meta = EVENT_META[event.type];
  const teamName = event.team === "home" ? match.homeTeam : match.awayTeam;
  const isGoal = event.type === "goal";
  return (
    <li className={`ev ${meta.className} side-${event.team}`}>
      <div className="ev-minute">{event.minute}'</div>
      <div className="ev-card">
        <div className="ev-head">
          <span className="ev-icon">{meta.icon(isGoal ? 26 : 20)}</span>
          <strong>{isGoal ? "¡GOOOL!" : meta.label}</strong>
          <span className="ev-team">
            <TeamCrest team={teamName} size={16} /> {teamName}
          </span>
        </div>
        {event.type === "substitution" ? (
          <div className="ev-body">
            <span className="sub-in">▲ {event.playerIn}</span>
            <span className="sub-out">▼ {event.player}</span>
          </div>
        ) : (
          event.player && <div className="ev-body ev-player">{event.player}</div>
        )}
        {event.description && <div className="ev-desc">{event.description}</div>}
      </div>
    </li>
  );
}

export function Legend() {
  return (
    <ul className="legend" aria-label="Tipos de evento">
      {EVENT_TYPES.map((t) => (
        <li key={t} className={EVENT_META[t].className}>
          {EVENT_META[t].icon(16)} {EVENT_META[t].label}
        </li>
      ))}
    </ul>
  );
}

export function Timeline({ events, match }: { events: MatchEventDTO[]; match: MatchDTO }) {
  if (events.length === 0) {
    return (
      <div className="empty">
        <span className="empty-ball">{EVENT_META.goal.icon(40)}</span>
        <p>Todavía no hay jugadas. ¡El balón está por rodar!</p>
      </div>
    );
  }
  return (
    <ol className="timeline">
      {events.map((e) => (
        <EventItem key={e.id} event={e} match={match} />
      ))}
    </ol>
  );
}
