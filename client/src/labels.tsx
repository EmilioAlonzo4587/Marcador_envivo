import type { ReactNode } from "react";
import type { EventType, MatchStatus, PlayerPosition } from "../../shared/types";
import { IconBall, IconCard, IconSwap, IconWhistle } from "./components/Icons";

export const POSITION_LABEL: Record<PlayerPosition, string> = {
  goalkeeper: "Porteros",
  defender: "Defensas",
  midfielder: "Centrocampistas",
  forward: "Delanteros",
};

export const EVENT_META: Record<EventType, { label: string; icon: (size?: number) => ReactNode; className: string }> = {
  goal: { label: "Gol", icon: (s) => <IconBall size={s} />, className: "ev-goal" },
  foul: { label: "Falta", icon: (s) => <IconWhistle size={s} />, className: "ev-foul" },
  substitution: { label: "Cambio", icon: (s) => <IconSwap size={s} />, className: "ev-sub" },
  yellow_card: { label: "Tarjeta amarilla", icon: (s) => <IconCard size={s} color="#ffd60a" />, className: "ev-yellow" },
  red_card: { label: "Tarjeta roja", icon: (s) => <IconCard size={s} color="#ff2d55" />, className: "ev-red" },
};

export const STATUS_LABEL: Record<MatchStatus, string> = {
  scheduled: "Programado",
  live: "En vivo",
  halftime: "Descanso",
  finished: "Finalizado",
};
