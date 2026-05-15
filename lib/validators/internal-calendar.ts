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

const optionalUrl = optionalText.refine((value) => {
  if (!value) return true;
  return z.string().url().safeParse(value).success;
}, "Ingresar una URL valida");

export const internalCalendarEventTypes = [
  "call",
  "meeting",
  "internal_meeting",
  "reminder",
  "task_deadline",
  "follow_up",
  "report_due",
  "alert_follow_up",
  "other"
] as const;

export const internalCalendarStatuses = ["scheduled", "completed", "cancelled", "postponed"] as const;
export const internalCalendarRecurrenceRules = ["daily", "weekly", "monthly", "custom"] as const;

export const internalCalendarEventSchema = z
  .object({
    title: z.string().trim().min(2, "El titulo es obligatorio"),
    description: optionalText,
    notes: optionalText,
    event_type: z.enum(internalCalendarEventTypes),
    status: z.enum(internalCalendarStatuses),
    start_at: z.string().trim().min(1, "La fecha de inicio es obligatoria"),
    end_at: optionalText,
    all_day: z.boolean().default(false),
    location: optionalText,
    meeting_url: optionalUrl,
    client_id: optionalUuid,
    contact_id: optionalUuid,
    stakeholder_id: optionalUuid,
    task_id: optionalUuid,
    assigned_to: optionalUuid,
    is_recurring: z.boolean().default(false),
    recurrence_rule: z.enum(internalCalendarRecurrenceRules).optional().nullable()
  })
  .refine((value) => !value.end_at || new Date(value.end_at).getTime() >= new Date(value.start_at).getTime(), {
    message: "La fecha de fin no puede ser anterior al inicio",
    path: ["end_at"]
  })
  .refine((value) => !value.is_recurring || Boolean(value.recurrence_rule), {
    message: "Elegir una regla de recurrencia",
    path: ["recurrence_rule"]
  });

export type InternalCalendarEventValues = z.infer<typeof internalCalendarEventSchema>;
export type InternalCalendarEventType = (typeof internalCalendarEventTypes)[number];
export type InternalCalendarStatus = (typeof internalCalendarStatuses)[number];
