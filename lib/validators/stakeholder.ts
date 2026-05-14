import { z } from "zod";

const optionalText = z.string().optional().nullable().transform((value) => (value?.trim() ? value.trim() : null));
const optionalEmail = z.string().trim().optional().nullable().transform((value) => value || null).refine((value) => !value || z.string().email().safeParse(value).success, "Email invalido");
const optionalUrl = z.string().trim().optional().nullable().transform((value) => value || null).refine((value) => !value || /^https?:\/\/.+/i.test(value), "Debe ser una URL valida");

export const stakeholderTypes = ["official", "legislator", "advisor", "chamber", "journalist", "union", "ngo", "business_person", "regulator", "provincial_referent", "other"] as const;
export const stakeholderStances = ["ally", "neutral", "opponent", "unknown"] as const;
export const influenceLevels = ["low", "medium", "high", "critical"] as const;
export const sensitivityLevels = ["low", "medium", "high", "restricted"] as const;

export const stakeholderClientSchema = z.object({
  client_id: z.string().uuid(),
  relationship_description: optionalText
});

export const stakeholderSchema = z.object({
  full_name: z.string().trim().min(2, "El nombre es obligatorio"),
  organization: optionalText,
  title: optionalText,
  email: optionalEmail,
  phone: optionalText,
  linkedin_url: optionalUrl,
  type: z.enum(stakeholderTypes),
  political_party: optionalText,
  jurisdiction: optionalText,
  influence_area: optionalText,
  influence_level: z.enum(influenceLevels),
  stance: z.enum(stakeholderStances),
  sensitivity_level: z.enum(sensitivityLevels),
  notes: optionalText,
  is_active: z.boolean().default(true),
  clients: z.array(stakeholderClientSchema).default([]),
  topic_ids: z.array(z.string().uuid()).default([])
}).refine((value) => new Set(value.clients.map((client) => client.client_id)).size === value.clients.length, {
  message: "No se pueden repetir clientes",
  path: ["clients"]
}).refine((value) => new Set(value.topic_ids).size === value.topic_ids.length, {
  message: "No se pueden repetir temas",
  path: ["topic_ids"]
});

export type StakeholderFormValues = z.infer<typeof stakeholderSchema>;
