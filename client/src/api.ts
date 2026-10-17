import type {
  MatchDTO,
  MatchDetailDTO,
  MatchPlayersDTO,
  MatchStatus,
  StreamEventPayload,
} from "../../shared/types";
import type { CreateEventInput } from "../../shared/validation";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor", 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error ?? `Error ${res.status}`, res.status, body.fields);
  return body as T;
}

export const api = {
  listMatches: () => request<MatchDTO[]>("/api/matches"),
  getMatch: (id: number) => request<MatchDetailDTO>(`/api/matches/${id}`),
  getPlayers: (id: number) => request<MatchPlayersDTO>(`/api/matches/${id}/players`),
  createEvent: (id: number, data: CreateEventInput) =>
    request<StreamEventPayload>(`/api/matches/${id}/events`, { method: "POST", body: JSON.stringify(data) }),
  updateStatus: (id: number, status: MatchStatus) =>
    request<MatchDTO>(`/api/matches/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  streamUrl: (id: number, lastEventId: number) => `/api/matches/${id}/events/stream?lastEventId=${lastEventId}`,
};
