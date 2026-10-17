import type { ConnectionState } from "../useMatchStream";
import { IconBroadcast } from "./Icons";

const LABEL: Record<ConnectionState, string> = {
  connecting: "Conectando…",
  connected: "Transmisión en vivo",
  reconnecting: "Reconectando…",
  disconnected: "Desconectado",
};

export function ConnectionBadge({ state, onReconnect }: { state: ConnectionState; onReconnect: () => void }) {
  return (
    <div className={`conn conn-${state}`} role="status" aria-live="polite">
      <IconBroadcast size={16} />
      {LABEL[state]}
      {state === "disconnected" && (
        <button type="button" className="link-btn" onClick={onReconnect}>
          Reintentar
        </button>
      )}
    </div>
  );
}
