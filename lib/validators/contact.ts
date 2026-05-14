import { z } from "zod";

const optionalText = z
  .string()
  .optional()
  .nullable()
  .transform((value) => (value?.trim() ? value.trim() : null));

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => value || null)
  .refine((value) => !value || z.string().email().safeParse(value).success, "Email invalido");

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => value || null)
  .refine((value) => !value || /^https?:\/\/.+/i.test(value), "Debe ser una URL valida");

export const contactSchema = z
  .object({
    client_id: z.string().uuid(),
    first_name: z.string().trim().optional().default(""),
    last_name: z.string().trim().optional().default(""),
    title: optionalText,
    email: optionalEmail,
    whatsapp: optionalText,
    linkedin_url: optionalUrl,
    area: optionalText,
    relationship_role: optionalText,
    is_primary: z.boolean().default(false),
    is_active: z.boolean().default(true),
    birthday: z
      .string()
      .optional()
      .nullable()
      .transform((value) => value || null),
    notes: optionalText
  })
  .refine((value) => Boolean(`${value.first_name} ${value.last_name}`.trim()), {
    message: "Ingresar nombre o nombre completo",
    path: ["first_name"]
  });

export type ContactFormValues = z.infer<typeof contactSchema>;
