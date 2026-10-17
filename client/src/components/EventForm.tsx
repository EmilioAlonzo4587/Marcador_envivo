import { useEffect, useState, type FormEvent } from "react";
import { EVENT_TYPES, type MatchDTO, type MatchPlayersDTO } from "../../../shared/types";
import { createEventSchema, fieldErrors } from "../../../shared/validation";
import { api, ApiError } from "../api";
import { EVENT_META } from "../labels";
import { PlayerSelect } from "./PlayerSelect";
import { TeamCrest } from "./TeamCrest";
import { IconClock, IconWhistle } from "./Icons";

const EMPTY = { type: "goal", minute: "", team: "home", player: "", playerIn: "", description: "" };

export function EventForm({ match }: { match: MatchDTO }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [rosters, setRosters] = useState<MatchPlayersDTO>({ home: [], away: [] });

  useEffect(() => {
    api.getPlayers(match.id).then(setRosters, () => setRosters({ home: [], away: [] }));
  }, [match.id]);

  const set = (field: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setValues((v) => ({
      ...v,
      [field]: e.target.value,
      // Al cambiar de equipo, los jugadores elegidos ya no son válidos.
      ...(field === "team" && { player: "", playerIn: "" }),
    }));
  const roster = values.team === "away" ? rosters.away : rosters.home;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setNotice(null);
    const input = {
      ...values,
      minute: values.minute === "" ? undefined : values.minute,
      playerIn: values.type === "substitution" ? values.playerIn : "",
    };
    // Validación en el navegador con el mismo esquema que usa el servidor.
    const parsed = createEventSchema.safeParse(input);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));

    setErrors({});
    setSending(true);
    try {
      const { event } = await api.createEvent(match.id, parsed.data);
      setNotice(`${EVENT_META[event.type].label} registrado en el minuto ${event.minute}'`);
      setValues((v) => ({ ...EMPTY, type: v.type, team: v.team, minute: v.minute }));
    } catch (err) {
      if (err instanceof ApiError) setErrors({ ...err.fields, _form: err.message });
      else setErrors({ _form: "No se pudo conectar con el servidor" });
    } finally {
      setSending(false);
    }
  }

  const err = (f: string) => errors[f] && <span className="field-error">{errors[f]}</span>;
  const isSub = values.type === "substitution";

  return (
    <form className="event-form" onSubmit={onSubmit} noValidate>
      <h3 className="panel-title">
        <IconWhistle size={18} /> Registrar jugada
      </h3>

      <fieldset>
        <legend>Tipo de jugada</legend>
        <div className="type-grid">
          {EVENT_TYPES.map((t) => (
            <label key={t} className={`type-btn ${EVENT_META[t].className} ${values.type === t ? "active" : ""}`}>
              <input type="radio" name="type" value={t} checked={values.type === t} onChange={set("type")} />
              {EVENT_META[t].icon(26)}
              <span>{EVENT_META[t].label}</span>
            </label>
          ))}
        </div>
        {err("type")}
      </fieldset>

      <fieldset>
        <legend>Equipo</legend>
        <div className="team-grid">
          {(["home", "away"] as const).map((side) => {
            const name = side === "home" ? match.homeTeam : match.awayTeam;
            return (
              <label key={side} className={`team-btn ${values.team === side ? "active" : ""}`}>
                <input type="radio" name="team" value={side} checked={values.team === side} onChange={set("team")} />
                <TeamCrest team={name} size={30} />
                <span>{name}</span>
              </label>
            );
          })}
        </div>
        {err("team")}
      </fieldset>

      <label>
        <span className="lbl">
          <IconClock size={14} /> Minuto
        </span>
        <input type="number" min={0} max={130} value={values.minute} onChange={set("minute")} placeholder="Ej. 23" />
        {err("minute")}
      </label>

      <label>
        {isSub ? "Jugador que sale" : "Jugador"}
        <PlayerSelect players={roster} value={values.player} onChange={set("player")} />
        {err("player")}
      </label>

      {isSub && (
        <label>
          Jugador que entra
          <PlayerSelect players={roster} value={values.playerIn} onChange={set("playerIn")} exclude={values.player} />
          {err("playerIn")}
        </label>
      )}

      <label>
        Descripción (opcional)
        <input value={values.description} onChange={set("description")} placeholder="Detalle del evento" />
        {err("description")}
      </label>

      {errors._form && <p className="form-error">{errors._form}</p>}
      {notice && <p className="form-ok">{notice}</p>}

      <button type="submit" className="primary" disabled={sending}>
        {sending ? "Enviando…" : `Registrar ${EVENT_META[values.type as keyof typeof EVENT_META].label.toLowerCase()}`}
      </button>
    </form>
  );
}
