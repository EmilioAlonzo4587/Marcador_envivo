import type { Match, MatchEvent } from "./db/schema";
import type { MatchDTO, MatchEventDTO } from "../../shared/types";

export const toMatchDTO = (m: Match): MatchDTO => ({ ...m, createdAt: m.createdAt.toISOString() });
export const toEventDTO = (e: MatchEvent): MatchEventDTO => ({ ...e, createdAt: e.createdAt.toISOString() });
