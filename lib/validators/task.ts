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

const optionalDate = z
  .string()
  .optional()
  .nullable()
  .transform((value) => value || null);

export const taskStatuses = ["pending", "in_progress", "in_review", "blocked", "completed", "cancelled"] as const;
export const taskPriorities = ["low", "medium", "high", "urgent"] as const;
export const recurrenceRules = ["daily", "weekly", "monthly", "custom"] as const;

export const taskSchema = z
  .object({
    title: z.string().trim().min(2, "El titulo es obligatorio"),
    description: optionalText,
    client_id: optionalUuid,
    status: z.enum(taskStatuses),
    priority: z.enum(taskPriorities),
    due_date: optionalDate,
    assignee_ids: z.array(z.string().uuid()).default([]),
    origin_type: optionalText,
    origin_id: optionalUuid,
    is_recurring: z.boolean().default(false),
    recurrence_rule: z.enum(recurrenceRules).optional().nullable(),
    initial_comment: optionalText
  })
  .refine((value) => !value.is_recurring || Boolean(value.recurrence_rule), {
    message: "Elegir una regla de recurrencia",
    path: ["recurrence_rule"]
  })
  .refine((value) => new Set(value.assignee_ids).size === value.assignee_ids.length, {
    message: "No se pueden repetir responsables",
    path: ["assignee_ids"]
  });

export const taskCommentSchema = z.object({
  body: z.string().trim().min(1, "El comentario no puede estar vacio")
});

export type TaskFormValues = z.infer<typeof taskSchema>;
export type TaskCommentValues = z.infer<typeof taskCommentSchema>;
export type TaskStatus = (typeof taskStatuses)[number];
export type TaskPriority = (typeof taskPriorities)[number];
