"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { recurrenceRules, taskPriorities, taskSchema, taskStatuses, type TaskFormValues } from "@/lib/validators/task";

type ClientOption = { id: string; name: string };
type ProfileOption = { id: string; label: string };
type TaskValue = Partial<TaskFormValues> & { id?: string };

const defaults: TaskFormValues = {
  title: "",
  description: "",
  client_id: "",
  status: "pending",
  priority: "medium",
  due_date: "",
  assignee_ids: [],
  origin_type: "",
  origin_id: "",
  is_recurring: false,
  recurrence_rule: null,
  initial_comment: ""
};

export function TaskForm({
  action,
  task,
  clients,
  profiles,
  lockedClientId
}: {
  action: (values: TaskFormValues) => Promise<void>;
  task?: TaskValue | null;
  clients: ClientOption[];
  profiles: ProfileOption[];
  lockedClientId?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      ...defaults,
      ...task,
      description: task?.description || "",
      client_id: lockedClientId || task?.client_id || "",
      due_date: task?.due_date || "",
      assignee_ids: task?.assignee_ids || [],
      origin_type: task?.origin_type || "",
      origin_id: task?.origin_id || "",
      recurrence_rule: task?.recurrence_rule || null,
      initial_comment: ""
    }
  });
  const selectedAssignees = form.watch("assignee_ids");
  const isRecurring = form.watch("is_recurring");

  function onSubmit(values: TaskFormValues) {
    setSubmitError(null);
    startTransition(async () => {
      try {
        await action(values);
      } catch (error) {
        const digest = typeof error === "object" && error && "digest" in error ? String(error.digest) : "";
        if (digest.startsWith("NEXT_REDIRECT")) throw error;
        setSubmitError(error instanceof Error ? error.message : "No pudimos guardar la tarea.");
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <section className="grid gap-5 md:grid-cols-2">
        <Field label="Titulo" error={form.formState.errors.title?.message}>
          <Input {...form.register("title")} />
        </Field>
        <Field label="Cliente opcional">
          <select
            {...form.register("client_id")}
            disabled={Boolean(lockedClientId)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-70"
          >
            <option value="">Sin cliente</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
          {lockedClientId ? <input type="hidden" {...form.register("client_id")} value={lockedClientId} /> : null}
        </Field>
        <SelectField label="Estado" options={taskStatuses} {...form.register("status")} />
        <SelectField label="Prioridad" options={taskPriorities} {...form.register("priority")} />
        <Field label="Fecha limite">
          <Input type="date" {...form.register("due_date")} />
        </Field>
        <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <input type="checkbox" {...form.register("is_recurring")} />
          Recurrente
        </label>
        {isRecurring ? (
          <SelectField label="Regla de recurrencia" options={recurrenceRules} error={form.formState.errors.recurrence_rule?.message} {...form.register("recurrence_rule")} />
        ) : null}
        <Field label="Descripcion" wide>
          <Textarea {...form.register("description")} />
        </Field>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Responsables</h2>
          {form.formState.errors.assignee_ids ? <p className="mt-1 text-xs text-destructive">{form.formState.errors.assignee_ids.message}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {profiles.map((profile) => {
            const checked = selectedAssignees.includes(profile.id);
            return (
              <label key={profile.id} className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...selectedAssignees, profile.id]
                      : selectedAssignees.filter((id) => id !== profile.id);
                    form.setValue("assignee_ids", next, { shouldDirty: true, shouldValidate: true });
                  }}
                />
                {profile.label}
              </label>
            );
          })}
          {!profiles.length ? <p className="text-sm text-muted-foreground">No hay usuarios internos disponibles.</p> : null}
        </div>
      </section>

      {!task?.id ? (
        <section className="space-y-2">
          <Label>Comentario inicial opcional</Label>
          <Textarea {...form.register("initial_comment")} />
        </section>
      ) : null}

      {submitError ? <Badge variant="warning">{submitError}</Badge> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar tarea"}
      </Button>
    </form>
  );
}

function Field({ label, children, error, wide = false }: { label: string; children: React.ReactNode; error?: string; wide?: boolean }) {
  return (
    <div className={wide ? "space-y-2 md:col-span-2" : "space-y-2"}>
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function SelectField({
  label,
  options,
  error,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: readonly string[]; error?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select {...props} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
        <option value="" disabled>Seleccionar</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
