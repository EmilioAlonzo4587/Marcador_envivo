import type { MatchDTO } from "../../../shared/types";
import { STATUS_LABEL } from "../labels";
import { TeamCrest } from "./TeamCrest";

interface Props {
  matches: MatchDTO[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function MatchSelector({ matches, selectedId, onSelect }: Props) {
  return (
    <nav className="match-list" aria-label="Partidos">
      {matches.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`match-card ${m.id === selectedId ? "active" : ""}`}
          aria-pressed={m.id === selectedId}
          onClick={() => onSelect(m.id)}
        >
          <span className={`mc-status st-${m.status}`}>
            {m.status === "live" && <span className="live-dot" />}
            {STATUS_LABEL[m.status]}
          </span>
          <span className="mc-row">
            <TeamCrest team={m.homeTeam} size={26} />
            <span className="mc-team">{m.homeTeam}</span>
            <span className="mc-goals">{m.homeScore}</span>
          </span>
          <span className="mc-row">
            <TeamCrest team={m.awayTeam} size={26} />
            <span className="mc-team">{m.awayTeam}</span>
            <span className="mc-goals">{m.awayScore}</span>
          </span>
        </button>
      ))}
    </nav>
  );
}
