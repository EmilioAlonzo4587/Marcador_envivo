import { PLAYER_POSITIONS, type PlayerDTO } from "../../../shared/types";
import { POSITION_LABEL } from "../labels";

interface Props {
  players: PlayerDTO[];
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  exclude?: string;
}

/** Lista desplegable de la plantilla agrupada por posición. Sin plantilla, campo de texto libre. */
export function PlayerSelect({ players, value, onChange, exclude }: Props) {
  if (players.length === 0) return <input value={value} onChange={onChange} placeholder="Nombre" />;

  const available = players.filter((p) => p.name !== exclude);
  const groups = [
    ...PLAYER_POSITIONS.map((pos) => ({ label: POSITION_LABEL[pos], items: available.filter((p) => p.position === pos) })),
    { label: "Otros", items: available.filter((p) => p.position === null) },
  ].filter((g) => g.items.length > 0);

  return (
    <select value={value} onChange={onChange}>
      <option value="">Selecciona un jugador</option>
      {groups.map((g) => (
        <optgroup key={g.label} label={g.label}>
          {g.items.map((p) => (
            <option key={p.id} value={p.name}>
              {p.shirtNumber !== null ? `${p.shirtNumber}. ` : ""}
              {p.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
