/** Colores de cada club para escudos y acentos del marcador. */
export interface TeamStyle {
  primary: string;
  secondary: string;
  short: string;
}

const TEAMS: Record<string, TeamStyle> = {
  Barcelona: { primary: "#a50044", secondary: "#004d98", short: "FCB" },
  "Real Madrid": { primary: "#f5f5f5", secondary: "#febe10", short: "RMA" },
  "Boca Juniors": { primary: "#003c8f", secondary: "#ffd100", short: "BOC" },
  "River Plate": { primary: "#f5f5f5", secondary: "#e30613", short: "RIV" },
  América: { primary: "#ffd200", secondary: "#002b5c", short: "AME" },
  Chivas: { primary: "#e4002b", secondary: "#003da5", short: "GDL" },
};

export function teamStyle(name: string): TeamStyle {
  return TEAMS[name] ?? { primary: "#6c7bff", secondary: "#2b2f5e", short: name.slice(0, 3).toUpperCase() };
}
