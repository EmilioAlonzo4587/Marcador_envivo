import { useEffect, useState } from "react";

export interface Route {
  view: "public" | "admin";
  matchId: number | null;
}

/** Rutas: #/partido/:id (pública) y #/admin/:id (administración). */
function parse(hash: string): Route {
  const [, section, id] = hash.replace(/^#/, "").split("/");
  const matchId = id && /^\d+$/.test(id) ? Number(id) : null;
  return { view: section === "admin" ? "admin" : "public", matchId };
}

export function toHash(route: Route) {
  const section = route.view === "admin" ? "admin" : "partido";
  return `#/${section}${route.matchId ? `/${route.matchId}` : ""}`;
}

export function useHashRoute() {
  const [route, setRoute] = useState(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  const navigate = (next: Route) => {
    window.location.hash = toHash(next);
  };
  return { route, navigate };
}
