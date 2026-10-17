import { useState } from "react";
import { MATCH_STATUSES, type MatchDTO } from "../../../shared/types";
import { api } from "../api";
import { STATUS_LABEL } from "../labels";
import { IconClock } from "./Icons";

export function StatusControls({ match }: { match: MatchDTO }) {
  const [error, setError] = useState<string | null>(null);

  async function change(status: MatchDTO["status"]) {
    setError(null);
    try {
      await api.updateStatus(match.id, status); // El nuevo estado llega por SSE.
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="status-controls">
      <h3 className="panel-title">
        <IconClock size={18} /> Estado del partido
      </h3>
      <div className="segmented">
        {MATCH_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`st-${s} ${match.status === s ? "active" : ""}`}
            aria-pressed={match.status === s}
            disabled={match.status === s}
            onClick={() => change(s)}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
