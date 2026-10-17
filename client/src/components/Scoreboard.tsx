import type { CSSProperties } from "react";
import type { MatchDTO, MatchEventDTO, TeamSide } from "../../../shared/types";
import { STATUS_LABEL } from "../labels";
import { teamStyle } from "../teams";
import { IconBall, IconStadium } from "./Icons";
import { TeamCrest } from "./TeamCrest";

function Scorers({ events, side }: { events: MatchEventDTO[]; side: TeamSide }) {
  const goals = events.filter((e) => e.type === "goal" && e.team === side);
  if (goals.length === 0) return null;
  return (
    <ul className={`sb-scorers ${side}`}>
      {goals.map((g) => (
        <li key={g.id}>
          <IconBall size={13} /> {g.player} <b>{g.minute}'</b>
        </li>
      ))}
    </ul>
  );
}

export function Scoreboard({ match, events }: { match: MatchDTO; events: MatchEventDTO[] }) {
  const style = {
    "--home": teamStyle(match.homeTeam).secondary,
    "--away": teamStyle(match.awayTeam).secondary,
  } as CSSProperties;

  return (
    <section className="scoreboard" style={style}>
      <div className="sb-top">
        <span className={`live-pill st-${match.status}`}>
          {match.status === "live" && <span className="live-dot" />}
          {STATUS_LABEL[match.status]}
        </span>
        {match.venue && (
          <span className="sb-venue">
            <IconStadium size={16} /> {match.venue}
          </span>
        )}
      </div>

      <div className="sb-main">
        <div className="sb-team">
          <TeamCrest team={match.homeTeam} size={72} />
          <span className="sb-name">{match.homeTeam}</span>
          <span className="sb-tag">Local</span>
        </div>

        <div className="sb-score" aria-label={`Marcador ${match.homeScore} a ${match.awayScore}`}>
          <span key={`h${match.homeScore}`} className="digit pop">
            {match.homeScore}
          </span>
          <span className="sb-sep">:</span>
          <span key={`a${match.awayScore}`} className="digit pop">
            {match.awayScore}
          </span>
        </div>

        <div className="sb-team">
          <TeamCrest team={match.awayTeam} size={72} />
          <span className="sb-name">{match.awayTeam}</span>
          <span className="sb-tag">Visitante</span>
        </div>
      </div>

      <div className="sb-bottom">
        <Scorers events={events} side="home" />
        <Scorers events={events} side="away" />
      </div>
    </section>
  );
}
