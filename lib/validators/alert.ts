import { z } from "zod";
import { recipientSchema } from "./report";

const optionalText = z.string().optional().nullable().transform((value) => (value?.trim() ? value.trim() : null));
const optionalDateTime = z.string().optional().nullable().transform((value) => value || null);
const optionalUuid = z.string().optional().nullable().transform((value) => (value?.trim() ? value.trim() : null)).refine((value) => !value || z.string().uuid().safeParse(value).success, "Seleccion invalida");
const optionalUrl = z.string().trim().optional().nullable().transform((value) => value || null).refine((value) => !value || /^https?:\/\/.+/i.test(value), "Debe ser una URL valida");

export const alertCategories = ["legislative", "executive", "judicial", "regulatory", "media", "provincial", "municipal", "international", "other"] as const;
export const alertUrgencies = ["low", "medium", "high", "critical"] as const;
export const alertChannels = ["email", "whatsapp", "pdf", "other"] as const;

export const alertSchema = z.object({
  title: z.string().trim().min(2, "El titulo es obligatorio"),
  category: z.enum(alertCategories),
  urgency: z.enum(alertUrgencies),
  description: optionalText,
  content: optionalText,
  sent_at: optionalDateTime,
  medium: z.enum(alertChannels),
  responsible_id: optionalUuid,
  client_ids: z.array(z.string().uuid()).default([]),
  industry_ids: z.array(z.string().uuid()).default([]),
  interest_ids: z.array(z.string().uuid()).default([]),
  recipients: z.array(recipientSchema).default([]),
  attachment_url: optionalUrl,
  notes: optionalText
}).refine((value) => new Set(value.client_ids).size === value.client_ids.length, {
  message: "No se pueden repetir clientes",
  path: ["client_ids"]
}).refine((value) => new Set(value.industry_ids).size === value.industry_ids.length, {
  message: "No se pueden repetir rubros",
  path: ["industry_ids"]
}).refine((value) => new Set(value.interest_ids).size === value.interest_ids.length, {
  message: "No se pueden repetir issues",
  path: ["interest_ids"]
}).refine((value) => {
  const emails = value.recipients.map((recipient) => recipient.email).filter(Boolean);
  return new Set(emails).size === emails.length;
}, {
  message: "No se pueden repetir destinatarios por email",
  path: ["recipients"]
});

export type AlertFormValues = z.infer<typeof alertSchema>;
