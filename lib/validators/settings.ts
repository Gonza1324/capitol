import { z } from "zod";
import type { UserRole } from "@/lib/supabase/types";

export const userRoles: UserRole[] = ["admin", "partner_director", "analyst", "assistant", "external_client"];

const optionalText = z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? null : value), z.string().trim().nullable());

export const createUserSchema = z.object({
  email: z.string().trim().email("Ingresá un email válido."),
  full_name: optionalText,
  role: z.enum(userRoles as [UserRole, ...UserRole[]]),
  password: z.string().min(8, "La contraseña temporal debe tener al menos 8 caracteres.")
});

export const updateUserSchema = z.object({
  email: z.string().trim().email("Ingresá un email válido."),
  full_name: optionalText,
  role: z.enum(userRoles as [UserRole, ...UserRole[]]),
  password: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres.").optional()
  )
});

export type CreateUserValues = z.infer<typeof createUserSchema>;
export type UpdateUserValues = z.infer<typeof updateUserSchema>;
