import { z } from "zod";

const optionalText = z.string().optional().nullable().transform((value) => (value?.trim() ? value.trim() : null));
const optionalUrl = z.string().trim().optional().nullable().transform((value) => value || null).refine((value) => !value || /^https?:\/\/.+/i.test(value), "Debe ser una URL valida");

export const documentEntityTypes = ["client", "contact", "task", "interaction", "report", "alert", "stakeholder"] as const;
export const documentSourceTypes = ["upload", "external_link"] as const;
export const documentTypes = ["contract", "report", "presentation", "spreadsheet", "note", "legal", "media", "image", "audio", "other"] as const;

export const documentMetadataSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio"),
  description: optionalText,
  document_type: z.enum(documentTypes),
  source_type: z.enum(documentSourceTypes),
  external_url: optionalUrl,
  entity_type: z.enum(documentEntityTypes),
  entity_id: z.string().uuid("Selecciona una entidad")
}).refine((value) => value.source_type !== "external_link" || Boolean(value.external_url), {
  message: "La URL externa es obligatoria",
  path: ["external_url"]
});

export type DocumentMetadataValues = z.infer<typeof documentMetadataSchema>;
export type DocumentEntityType = (typeof documentEntityTypes)[number];
export type DocumentSourceType = (typeof documentSourceTypes)[number];
export type DocumentType = (typeof documentTypes)[number];
