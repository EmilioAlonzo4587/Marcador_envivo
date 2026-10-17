import { z } from "zod";
import { EVENT_TYPES, MATCH_STATUSES, TEAM_SIDES } from "./types";

const optionalText = z
  .string()
  .trim()
  .max(80, "Máximo 80 caracteres")
  .optional()
  .transform((v) => (v ? v : undefined));

export const createEventSchema = z
  .object({
    type: z.enum(EVENT_TYPES, { message: "Tipo de evento inválido" }),
    minute: z.coerce
      .number({ message: "El minuto debe ser un número" })
      .int("El minuto debe ser entero")
      .min(0, "El minuto no puede ser negativo")
      .max(130, "El minuto no puede ser mayor a 130"),
    team: z.enum(TEAM_SIDES, { message: "Selecciona un equipo" }),
    player: optionalText,
    playerIn: optionalText,
    description: z
      .string()
      .trim()
      .max(200, "Máximo 200 caracteres")
      .optional()
      .transform((v) => (v ? v : undefined)),
  })
  .superRefine((data, ctx) => {
    if (data.type !== "substitution" && data.playerIn) {
      ctx.addIssue({ code: "custom", path: ["playerIn"], message: "Solo aplica a cambios" });
    }
    if (data.type === "goal" && !data.player) {
      ctx.addIssue({ code: "custom", path: ["player"], message: "Indica quién marcó el gol" });
    }
    if (data.type === "substitution") {
      if (!data.player) ctx.addIssue({ code: "custom", path: ["player"], message: "Indica quién sale" });
      if (!data.playerIn) ctx.addIssue({ code: "custom", path: ["playerIn"], message: "Indica quién entra" });
      if (data.player && data.player === data.playerIn) {
        ctx.addIssue({ code: "custom", path: ["playerIn"], message: "Debe ser un jugador distinto al que sale" });
      }
    }
  });

export const updateMatchSchema = z.object({
  status: z.enum(MATCH_STATUSES, { message: "Estado inválido" }),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

/** Convierte los errores de Zod en { campo: mensaje }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    out[key] ??= issue.message;
  }
  return out;
}
