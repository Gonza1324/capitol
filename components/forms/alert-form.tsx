"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RecipientsField } from "@/components/forms/recipients-field";
import { alertCategories, alertChannels, alertSchema, alertUrgencies, type AlertFormValues } from "@/lib/validators/alert";

const defaults: AlertFormValues = {
  title: "",
  category: "other",
  urgency: "medium",
  description: "",
  content: "",
  sent_at: "",
  medium: "email",
  responsible_id: "",
  client_ids: [],
  industry_ids: [],
  interest_ids: [],
  recipients: [],
  attachment_url: "",
  notes: ""
};

export function AlertForm({
  action,
  alert,
  clients,
  profiles,
  contacts,
  industries,
  interests,
  lockedClientId
}: {
  action: (values: AlertFormValues) => Promise<void>;
  alert?: Partial<AlertFormValues> | null;
  clients: Array<{ id: string; name: string }>;
  profiles: Array<{ id: string; label: string }>;
  contacts: Array<{ id: string; full_name: string; email: string | null }>;
  industries: Array<{ id: string; name: string }>;
  interests: Array<{ id: string; name: string }>;
  lockedClientId?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<AlertFormValues>({ resolver: zodResolver(alertSchema), defaultValues: normalize(alert, lockedClientId) });
  const clientIds = form.watch("client_ids");
  const industryIds = form.watch("industry_ids");
  const interestIds = form.watch("interest_ids");

  function onSubmit(values: AlertFormValues) {
    setSubmitError(null);
    startTransition(async () => {
      try {
        await action(values);
      } catch (error) {
        const digest = typeof error === "object" && error && "digest" in error ? String(error.digest) : "";
        if (digest.startsWith("NEXT_REDIRECT")) throw error;
        setSubmitError(error instanceof Error ? error.message : "No pudimos guardar la alerta.");
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <section className="grid gap-5 md:grid-cols-2">
        <Field label="Titulo" error={form.formState.errors.title?.message}><Input {...form.register("title")} /></Field>
        <SelectField label="Categoria" options={alertCategories} {...form.register("category")} />
        <SelectField label="Urgencia" options={alertUrgencies} {...form.register("urgency")} />
        <SelectField label="Canal" options={alertChannels} {...form.register("medium")} />
        <Field label="Fecha de envio"><Input type="datetime-local" {...form.register("sent_at")} /></Field>
        <Field label="Responsable">
          <select {...form.register("responsible_id")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Sin responsable</option>
            {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>)}
          </select>
        </Field>
        <Field label="Archivo/link" error={form.formState.errors.attachment_url?.message}><Input placeholder="https://..." {...form.register("attachment_url")} /></Field>
        <Field label="Descripcion" wide><Textarea {...form.register("description")} /></Field>
        <Field label="Contenido" wide><Textarea {...form.register("content")} /></Field>
        <Field label="Notas" wide><Textarea {...form.register("notes")} /></Field>
      </section>
      <Multi title="Clientes asociados" values={clientIds} options={clients} lockedId={lockedClientId} onChange={(next) => form.setValue("client_ids", next, { shouldDirty: true, shouldValidate: true })} />
      <Multi title="Rubros asociados" values={industryIds} options={industries} onChange={(next) => form.setValue("industry_ids", next, { shouldDirty: true, shouldValidate: true })} />
      <Multi title="Issues asociados" values={interestIds} options={interests} onChange={(next) => form.setValue("interest_ids", next, { shouldDirty: true, shouldValidate: true })} />
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Destinatarios</h2>
        <RecipientsField control={form.control} register={form.register} contacts={contacts} />
      </section>
      {submitError ? <Badge variant="warning">{submitError}</Badge> : null}
      <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : "Guardar alerta"}</Button>
    </form>
  );
}

function normalize(alert?: Partial<AlertFormValues> | null, lockedClientId?: string): AlertFormValues {
  const clientIds = alert?.client_ids || [];
  return { ...defaults, ...alert, client_ids: lockedClientId && !clientIds.includes(lockedClientId) ? [...clientIds, lockedClientId] : clientIds, recipients: alert?.recipients || [] };
}

function Multi({ title, values, options, lockedId, onChange }: { title: string; values: string[]; options: Array<{ id: string; name: string }>; lockedId?: string; onChange: (values: string[]) => void }) {
  return <section className="space-y-4"><h2 className="text-base font-semibold">{title}</h2><div className="flex flex-wrap gap-2">{options.map((option) => {
    const checked = values.includes(option.id);
    return <label key={option.id} className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"><input type="checkbox" disabled={lockedId === option.id} checked={checked} onChange={(event) => onChange(event.target.checked ? [...values, option.id] : values.filter((id) => id !== option.id))} />{option.name}</label>;
  })}</div></section>;
}

function Field({ label, children, error, wide = false }: { label: string; children: React.ReactNode; error?: string; wide?: boolean }) {
  return <div className={wide ? "space-y-2 md:col-span-2" : "space-y-2"}><Label>{label}</Label>{children}{error ? <p className="text-xs text-destructive">{error}</p> : null}</div>;
}

function SelectField({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: readonly string[] }) {
  return <div className="space-y-2"><Label>{label}</Label><select {...props} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>;
}
