import { useId } from "react";
import { teamStyle } from "../teams";

/** Escudo genérico con los colores del club (no reproduce escudos oficiales). */
export function TeamCrest({ team, size = 56 }: { team: string; size?: number }) {
  const { primary, secondary, short } = teamStyle(team);
  const clip = useId();
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 40 46" className="crest" role="img" aria-label={team}>
      <defs>
        <clipPath id={clip}>
          <path d="M20 1 38 6v14c0 12-8 20-18 25C10 40 2 32 2 20V6Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="40" height="46" fill={primary} />
        <path d="M0 0h20v46H0Z" fill={secondary} />
        <path d="M0 14h40v6H0Z" fill="rgba(0,0,0,.18)" />
      </g>
      <path d="M20 1 38 6v14c0 12-8 20-18 25C10 40 2 32 2 20V6Z" fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="2" />
      <text
        x="20"
        y="28"
        textAnchor="middle"
        fontFamily="'Bebas Neue', Impact, sans-serif"
        fontSize="13"
        fill="#fff"
        stroke="rgba(0,0,0,.65)"
        strokeWidth="2.4"
        paintOrder="stroke"
        letterSpacing=".5"
      >
        {short}
      </text>
    </svg>
  );
}
