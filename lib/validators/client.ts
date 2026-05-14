import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => value || null)
  .refine((value) => !value || /^https?:\/\/.+/i.test(value), "Debe ser una URL valida con http:// o https://");

const optionalText = z
  .string()
  .optional()
  .nullable()
  .transform((value) => (value?.trim() ? value.trim() : null));

const optionalDate = z
  .string()
  .optional()
  .nullable()
  .transform((value) => value || null);

export const interestAssignmentSchema = z
  .object({
    interest_id: z.string().uuid(),
    priority: z.enum(["high", "medium", "low"]),
    start_date: optionalDate,
    end_date: optionalDate
  })
  .refine((value) => !value.start_date || !value.end_date || value.end_date >= value.start_date, {
    message: "La fecha de fin no puede ser anterior a la fecha de inicio",
    path: ["end_date"]
  });

export const clientAssignmentSchema = z.object({
  user_id: z.string().uuid(),
  role: optionalText
});

export const clientSchema = z
  .object({
    name: z.string().trim().min(2, "El nombre es obligatorio"),
    legal_name: optionalText,
    tax_id: optionalText,
    status: z.enum(["active", "prospect", "paused", "former", "potential", "archived"]),
    client_type: z.enum(["company", "chamber", "ngo", "person", "public_agency", "embassy", "association", "other"]),
    description: optionalText,
    strategic_profile: optionalText,
    start_date: optionalDate,
    end_date: optionalDate,
    confidentiality_level: z.enum(["standard", "confidential", "restricted"]),
    website: optionalUrl,
    drive_url: optionalUrl,
    general_notes: optionalText,
    industry_ids: z.array(z.string().uuid()).default([]),
    interests: z.array(interestAssignmentSchema).default([]),
    assignments: z.array(clientAssignmentSchema).default([])
  })
  .refine((value) => !value.start_date || !value.end_date || value.end_date >= value.start_date, {
    message: "La fecha de finalizacion no puede ser anterior a la fecha de inicio",
    path: ["end_date"]
  });

export const catalogItemSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio")
});

export type ClientFormValues = z.infer<typeof clientSchema>;
