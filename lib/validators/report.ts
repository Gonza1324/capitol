import { z } from "zod";

const optionalText = z.string().optional().nullable().transform((value) => (value?.trim() ? value.trim() : null));
const optionalDateTime = z.string().optional().nullable().transform((value) => value || null);
const optionalUuid = z.string().optional().nullable().transform((value) => (value?.trim() ? value.trim() : null)).refine((value) => !value || z.string().uuid().safeParse(value).success, "Seleccion invalida");
const optionalUrl = z.string().trim().optional().nullable().transform((value) => value || null).refine((value) => !value || /^https?:\/\/.+/i.test(value), "Debe ser una URL valida");
const optionalEmail = z.string().trim().optional().nullable().transform((value) => value || null).refine((value) => !value || z.string().email().safeParse(value).success, "Email invalido");

export const reportTypes = ["weekly_report", "monthly_report", "political_context", "legislative_report", "regulatory_report", "media_report", "custom_report", "executive_memo", "urgent_alert", "official_gazette_daily_changes"] as const;
export const reportStatuses = ["draft", "in_review", "approved", "sent", "archived"] as const;

export const recipientSchema = z.object({
  contact_id: optionalUuid,
  name: optionalText,
  email: optionalEmail
}).refine((value) => Boolean(value.contact_id || value.name || value.email), {
  message: "Agregar contacto, nombre o email",
  path: ["name"]
});

export const reportSchema = z.object({
  title: z.string().trim().min(2, "El titulo es obligatorio"),
  type: z.enum(reportTypes),
  status: z.enum(reportStatuses),
  topic: optionalText,
  description: optionalText,
  sent_at: optionalDateTime,
  responsible_id: optionalUuid,
  client_ids: z.array(z.string().uuid()).default([]),
  recipients: z.array(recipientSchema).default([]),
  external_url: optionalUrl,
  notes: optionalText,
  approval_required: z.boolean().default(false),
  approved_by: optionalUuid,
  approved_at: optionalDateTime
}).refine((value) => new Set(value.client_ids).size === value.client_ids.length, {
  message: "No se pueden repetir clientes",
  path: ["client_ids"]
}).refine((value) => {
  const emails = value.recipients.map((recipient) => recipient.email).filter(Boolean);
  return new Set(emails).size === emails.length;
}, {
  message: "No se pueden repetir destinatarios por email",
  path: ["recipients"]
}).refine((value) => !value.approval_required || value.status !== "approved" || Boolean(value.approved_by || value.approved_at), {
  message: "Completar aprobador o fecha de aprobacion",
  path: ["approved_by"]
});

export type ReportFormValues = z.infer<typeof reportSchema>;
export type RecipientValues = z.infer<typeof recipientSchema>;
