"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { InternalCalendarOption } from "@/lib/data/internal-calendar";
import {
  internalCalendarEventSchema,
  internalCalendarEventTypes,
  internalCalendarRecurrenceRules,
  internalCalendarStatuses,
  type InternalCalendarEventValues
} from "@/lib/validators/internal-calendar";

type EventValue = Partial<InternalCalendarEventValues> & { id?: string };

const defaults: InternalCalendarEventValues = {
  title: "",
  description: "",
  notes: "",
  event_type: "meeting",
  status: "scheduled",
  start_at: "",
  end_at: "",
  all_day: false,
  location: "",
  meeting_url: "",
  client_id: "",
  contact_id: "",
  stakeholder_id: "",
  task_id: "",
  assigned_to: "",
  is_recurring: false,
  recurrence_rule: null,
  recurrence_interval: 1,
  recurrence_ends_at: "",
  recurrence_count: null
};

export function InternalCalendarEventForm({
  action,
  event,
  clients,
  contacts,
  stakeholders,
  tasks,
  profiles,
  lockedClientId
}: {
  action: (values: InternalCalendarEventValues) => Promise<void>;
  event?: EventValue | null;
  clients: InternalCalendarOption[];
  contacts: InternalCalendarOption[];
  stakeholders: InternalCalendarOption[];
  tasks: InternalCalendarOption[];
  profiles: InternalCalendarOption[];
  lockedClientId?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<InternalCalendarEventValues>({
    resolver: zodResolver(internalCalendarEventSchema),
    defaultValues: {
      ...defaults,
      ...event,
      description: event?.description || "",
      notes: event?.notes || "",
      start_at: toDateTimeLocal(event?.start_at),
      end_at: toDateTimeLocal(event?.end_at),
      meeting_url: event?.meeting_url || "",
      location: event?.location || "",
      client_id: lockedClientId || event?.client_id || "",
      contact_id: event?.contact_id || "",
      stakeholder_id: event?.stakeholder_id || "",
      task_id: event?.task_id || "",
      assigned_to: event?.assigned_to || "",
      recurrence_rule: event?.recurrence_rule || null,
      recurrence_interval: event?.recurrence_interval || 1,
      recurrence_ends_at: toDateTimeLocal(event?.recurrence_ends_at),
      recurrence_count: event?.recurrence_count || null
    }
  });
  const clientId = form.watch("client_id");
  const isRecurring = form.watch("is_recurring");
  const filteredContacts = useMemo(() => contacts.filter((contact) => !clientId || !contact.client_id || contact.client_id === clientId), [clientId, contacts]);
  const filteredTasks = useMemo(() => tasks.filter((task) => !clientId || !task.client_id || task.client_id === clientId), [clientId, tasks]);

  function onSubmit(values: InternalCalendarEventValues) {
    setSubmitError(null);
    startTransition(async () => {
      try {
        await action({
          ...values,
          start_at: toIso(values.start_at),
          end_at: values.end_at ? toIso(values.end_at) : null,
          recurrence_ends_at: values.recurrence_ends_at ? toIso(values.recurrence_ends_at) : null
        });
      } catch (error) {
        const digest = typeof error === "object" && error && "digest" in error ? String(error.digest) : "";
        if (digest.startsWith("NEXT_REDIRECT")) throw error;
        setSubmitError(error instanceof Error ? error.message : "No pudimos guardar el evento.");
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <section className="grid gap-5 md:grid-cols-2">
        <Field label="Titulo" error={form.formState.errors.title?.message}>
          <Input {...form.register("title")} />
        </Field>
        <SelectField label="Tipo" options={internalCalendarEventTypes} error={form.formState.errors.event_type?.message} {...form.register("event_type")} />
        <SelectField label="Estado" options={internalCalendarStatuses} error={form.formState.errors.status?.message} {...form.register("status")} />
        <Field label="Responsable">
          <select {...form.register("assigned_to")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Sin responsable</option>
            {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>)}
          </select>
        </Field>
        <Field label="Inicio" error={form.formState.errors.start_at?.message}>
          <Input type="datetime-local" {...form.register("start_at")} />
        </Field>
        <Field label="Fin" error={form.formState.errors.end_at?.message}>
          <Input type="datetime-local" {...form.register("end_at")} />
        </Field>
        <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <input type="checkbox" {...form.register("all_day")} />
          Todo el dia
        </label>
        <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <input type="checkbox" {...form.register("is_recurring")} />
          Recurrente
        </label>
        {isRecurring ? (
          <>
            <SelectField label="Regla de recurrencia" options={internalCalendarRecurrenceRules} error={form.formState.errors.recurrence_rule?.message} {...form.register("recurrence_rule")} />
            <Field label="Cada">
              <Input type="number" min={1} max={365} {...form.register("recurrence_interval")} />
            </Field>
            <Field label="Finaliza el">
              <Input type="datetime-local" {...form.register("recurrence_ends_at")} />
            </Field>
            <Field label="Cantidad maxima">
              <Input type="number" min={1} max={200} placeholder="Sin limite" {...form.register("recurrence_count")} />
            </Field>
          </>
        ) : null}
        <Field label="Ubicacion">
          <Input {...form.register("location")} />
        </Field>
        <Field label="Link de reunion" error={form.formState.errors.meeting_url?.message}>
          <Input {...form.register("meeting_url")} />
        </Field>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <Field label="Cliente">
          <select {...form.register("client_id")} disabled={Boolean(lockedClientId)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-70">
            <option value="">Sin cliente</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.label}</option>)}
          </select>
          {lockedClientId ? <input type="hidden" {...form.register("client_id")} value={lockedClientId} /> : null}
        </Field>
        <Field label="Contacto">
          <select {...form.register("contact_id")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Sin contacto</option>
            {filteredContacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.label}</option>)}
          </select>
        </Field>
        <Field label="Stakeholder">
          <select {...form.register("stakeholder_id")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Sin stakeholder</option>
            {stakeholders.map((stakeholder) => <option key={stakeholder.id} value={stakeholder.id}>{stakeholder.label}</option>)}
          </select>
        </Field>
        <Field label="Tarea asociada">
          <select {...form.register("task_id")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Sin tarea</option>
            {filteredTasks.map((task) => <option key={task.id} value={task.id}>{task.label}</option>)}
          </select>
        </Field>
        <Field label="Descripcion" wide>
          <Textarea {...form.register("description")} />
        </Field>
        <Field label="Notas" wide>
          <Textarea {...form.register("notes")} />
        </Field>
      </section>

      {submitError ? <Badge variant="warning">{submitError}</Badge> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar evento"}
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
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
  return parts.replace(" ", "T");
}

function toIso(value: string) {
  return new Date(value).toISOString();
}
