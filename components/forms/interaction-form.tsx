"use client";

import { useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatInteractionType } from "@/components/interactions/interaction-badges";
import { interactionSchema, interactionTypes, type InteractionFormValues } from "@/lib/validators/interaction";

type InteractionValue = Partial<InteractionFormValues> & { id?: string };

const defaults: InteractionFormValues = {
  type: "call",
  title: "",
  description: "",
  interaction_date: "",
  start_time: "",
  end_time: "",
  location: "",
  google_calendar_event_id: "",
  google_meet_url: "",
  client_ids: [],
  internal_participant_ids: [],
  external_participants: [],
  summary: "",
  notes: "",
  decisions: "",
  risks: "",
  next_steps: ""
};

export function InteractionForm({
  action,
  interaction,
  clients,
  profiles,
  contacts,
  stakeholders,
  lockedClientId
}: {
  action: (values: InteractionFormValues) => Promise<void>;
  interaction?: InteractionValue | null;
  clients: Array<{ id: string; name: string }>;
  profiles: Array<{ id: string; label: string }>;
  contacts: Array<{ id: string; full_name: string; email: string | null; client_id: string }>;
  stakeholders: Array<{ id: string; full_name: string; organization: string | null }>;
  lockedClientId?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<InteractionFormValues>({
    resolver: zodResolver(interactionSchema),
    defaultValues: normalizeDefaults(interaction, lockedClientId)
  });
  const externalFields = useFieldArray({ control: form.control, name: "external_participants" });
  const selectedClientIds = form.watch("client_ids");
  const selectedInternalIds = form.watch("internal_participant_ids");

  function onSubmit(values: InteractionFormValues) {
    setSubmitError(null);
    startTransition(async () => {
      try {
        await action(values);
      } catch (error) {
        const digest = typeof error === "object" && error && "digest" in error ? String(error.digest) : "";
        if (digest.startsWith("NEXT_REDIRECT")) throw error;
        setSubmitError(error instanceof Error ? error.message : "No pudimos guardar la interaccion.");
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <section className="grid gap-5 md:grid-cols-2">
        <SelectField label="Tipo" options={interactionTypes} {...form.register("type")} />
        <Field label="Titulo" error={form.formState.errors.title?.message}>
          <Input {...form.register("title")} />
        </Field>
        <Field label="Fecha" error={form.formState.errors.interaction_date?.message}>
          <Input type="date" {...form.register("interaction_date")} />
        </Field>
        <Field label="Lugar">
          <Input {...form.register("location")} />
        </Field>
        <Field label="Hora de inicio">
          <Input type="time" {...form.register("start_time")} />
        </Field>
        <Field label="Hora de fin" error={form.formState.errors.end_time?.message}>
          <Input type="time" {...form.register("end_time")} />
        </Field>
        <Field label="Link de reunion" error={form.formState.errors.google_meet_url?.message}>
          <Input placeholder="https://..." {...form.register("google_meet_url")} />
        </Field>
        <Field label="ID de evento externo">
          <Input {...form.register("google_calendar_event_id")} />
        </Field>
        <Field label="Descripcion" wide>
          <Textarea {...form.register("description")} />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold">Clientes vinculados</h2>
        <div className="flex flex-wrap gap-2">
          {clients.map((client) => {
            const checked = selectedClientIds.includes(client.id);
            return (
              <label key={client.id} className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  disabled={lockedClientId === client.id}
                  checked={checked}
                  onChange={(event) => {
                    const next = event.target.checked ? [...selectedClientIds, client.id] : selectedClientIds.filter((id) => id !== client.id);
                    form.setValue("client_ids", next, { shouldDirty: true, shouldValidate: true });
                  }}
                />
                {client.name}
              </label>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold">Participantes internos</h2>
        <div className="flex flex-wrap gap-2">
          {profiles.map((profile) => {
            const checked = selectedInternalIds.includes(profile.id);
            return (
              <label key={profile.id} className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    const next = event.target.checked ? [...selectedInternalIds, profile.id] : selectedInternalIds.filter((id) => id !== profile.id);
                    form.setValue("internal_participant_ids", next, { shouldDirty: true, shouldValidate: true });
                  }}
                />
                {profile.label}
              </label>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Participantes externos</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => externalFields.append({ contact_id: null, stakeholder_id: null, name: "", email: "" })}>
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        </div>
        <div className="space-y-3">
          {externalFields.fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
              <select {...form.register(`external_participants.${index}.contact_id`)} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">Contacto</option>
                {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.full_name}</option>)}
              </select>
              <select {...form.register(`external_participants.${index}.stakeholder_id`)} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">Stakeholder</option>
                {stakeholders.map((stakeholder) => <option key={stakeholder.id} value={stakeholder.id}>{stakeholder.full_name}</option>)}
              </select>
              <Input placeholder="Nombre libre" {...form.register(`external_participants.${index}.name`)} />
              <Input placeholder="Email" {...form.register(`external_participants.${index}.email`)} />
              <Button type="button" variant="ghost" size="icon" onClick={() => externalFields.remove(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <Field label="Resumen" wide><Textarea {...form.register("summary")} /></Field>
        <Field label="Notas libres" wide><Textarea {...form.register("notes")} /></Field>
        <Field label="Decisiones"><Textarea {...form.register("decisions")} /></Field>
        <Field label="Riesgos"><Textarea {...form.register("risks")} /></Field>
        <Field label="Proximos pasos" wide><Textarea {...form.register("next_steps")} /></Field>
      </section>

      {submitError ? <Badge variant="warning">{submitError}</Badge> : null}
      <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : "Guardar interaccion"}</Button>
    </form>
  );
}

function normalizeDefaults(interaction?: InteractionValue | null, lockedClientId?: string): InteractionFormValues {
  const clientIds = interaction?.client_ids || [];
  return {
    ...defaults,
    ...interaction,
    description: interaction?.description || "",
    interaction_date: interaction?.interaction_date || "",
    start_time: interaction?.start_time || "",
    end_time: interaction?.end_time || "",
    location: interaction?.location || "",
    google_calendar_event_id: interaction?.google_calendar_event_id || "",
    google_meet_url: interaction?.google_meet_url || "",
    client_ids: lockedClientId && !clientIds.includes(lockedClientId) ? [...clientIds, lockedClientId] : clientIds,
    internal_participant_ids: interaction?.internal_participant_ids || [],
    external_participants: interaction?.external_participants || [],
    summary: interaction?.summary || "",
    notes: interaction?.notes || "",
    decisions: interaction?.decisions || "",
    risks: interaction?.risks || "",
    next_steps: interaction?.next_steps || ""
  };
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
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: readonly string[] }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select {...props} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
        {options.map((option) => <option key={option} value={option}>{formatInteractionType(option)}</option>)}
      </select>
    </div>
  );
}
