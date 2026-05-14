import { z } from "zod";

const optionalText = z
  .string()
  .optional()
  .nullable()
  .transform((value) => (value?.trim() ? value.trim() : null));

const optionalUuid = z
  .string()
  .optional()
  .nullable()
  .transform((value) => (value?.trim() ? value.trim() : null))
  .refine((value) => !value || z.string().uuid().safeParse(value).success, "Seleccion invalida");

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => value || null)
  .refine((value) => !value || /^https?:\/\/.+/i.test(value), "Debe ser una URL valida");

export const interactionTypes = [
  "call",
  "in_person_meeting",
  "important_email",
  "whatsapp",
  "lunch",
  "presentation",
  "stakeholder_meeting",
  "internal_meeting",
  "other"
] as const;

export const externalParticipantSchema = z
  .object({
    contact_id: optionalUuid,
    stakeholder_id: optionalUuid,
    name: optionalText,
    email: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((value) => value || null)
      .refine((value) => !value || z.string().email().safeParse(value).success, "Email invalido")
  })
  .refine((value) => Boolean(value.contact_id || value.stakeholder_id || value.name || value.email), {
    message: "Agregar contacto, stakeholder, nombre o email",
    path: ["name"]
  });

export const interactionSchema = z
  .object({
    type: z.enum(interactionTypes),
    title: z.string().trim().min(2, "El titulo es obligatorio"),
    description: optionalText,
    interaction_date: z.string().min(1, "La fecha es obligatoria"),
    start_time: optionalText,
    end_time: optionalText,
    location: optionalText,
    google_calendar_event_id: optionalText,
    google_meet_url: optionalUrl,
    client_ids: z.array(z.string().uuid()).default([]),
    internal_participant_ids: z.array(z.string().uuid()).default([]),
    external_participants: z.array(externalParticipantSchema).default([]),
    summary: optionalText,
    notes: optionalText,
    decisions: optionalText,
    risks: optionalText,
    next_steps: optionalText
  })
  .refine((value) => new Set(value.client_ids).size === value.client_ids.length, {
    message: "No se pueden repetir clientes",
    path: ["client_ids"]
  })
  .refine((value) => new Set(value.internal_participant_ids).size === value.internal_participant_ids.length, {
    message: "No se pueden repetir participantes internos",
    path: ["internal_participant_ids"]
  })
  .refine((value) => !value.start_time || !value.end_time || value.end_time >= value.start_time, {
    message: "La hora de fin no puede ser anterior a la de inicio",
    path: ["end_time"]
  });

export type InteractionFormValues = z.infer<typeof interactionSchema>;
export type InteractionType = (typeof interactionTypes)[number];
