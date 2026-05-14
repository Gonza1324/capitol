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
import { reportSchema, reportStatuses, reportTypes, type ReportFormValues } from "@/lib/validators/report";

const defaults: ReportFormValues = {
  title: "",
  type: "custom_report",
  status: "draft",
  topic: "",
  description: "",
  sent_at: "",
  responsible_id: "",
  client_ids: [],
  recipients: [],
  external_url: "",
  notes: "",
  approval_required: false,
  approved_by: "",
  approved_at: ""
};

export function ReportForm({
  action,
  report,
  clients,
  profiles,
  contacts,
  lockedClientId
}: {
  action: (values: ReportFormValues) => Promise<void>;
  report?: Partial<ReportFormValues> | null;
  clients: Array<{ id: string; name: string }>;
  profiles: Array<{ id: string; label: string }>;
  contacts: Array<{ id: string; full_name: string; email: string | null }>;
  lockedClientId?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<ReportFormValues>({ resolver: zodResolver(reportSchema), defaultValues: normalize(report, lockedClientId) });
  const selectedClients = form.watch("client_ids");
  const approvalRequired = form.watch("approval_required");

  function onSubmit(values: ReportFormValues) {
    setSubmitError(null);
    startTransition(async () => {
      try {
        await action(values);
      } catch (error) {
        const digest = typeof error === "object" && error && "digest" in error ? String(error.digest) : "";
        if (digest.startsWith("NEXT_REDIRECT")) throw error;
        setSubmitError(error instanceof Error ? error.message : "No pudimos guardar el reporte.");
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <section className="grid gap-5 md:grid-cols-2">
        <Field label="Titulo" error={form.formState.errors.title?.message}><Input {...form.register("title")} /></Field>
        <SelectField label="Tipo" options={reportTypes} {...form.register("type")} />
        <SelectField label="Estado" options={reportStatuses} {...form.register("status")} />
        <Field label="Tema"><Input {...form.register("topic")} /></Field>
        <Field label="Fecha de envio"><Input type="datetime-local" {...form.register("sent_at")} /></Field>
        <Field label="Responsable">
          <select {...form.register("responsible_id")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Sin responsable</option>
            {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>)}
          </select>
        </Field>
        <Field label="Documento/link" error={form.formState.errors.external_url?.message}><Input placeholder="https://..." {...form.register("external_url")} /></Field>
        <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <input type="checkbox" {...form.register("approval_required")} />
          Requiere aprobacion
        </label>
        {approvalRequired ? (
          <>
            <Field label="Aprobado por" error={form.formState.errors.approved_by?.message}>
              <select {...form.register("approved_by")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Sin aprobador</option>
                {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>)}
              </select>
            </Field>
            <Field label="Fecha de aprobacion"><Input type="datetime-local" {...form.register("approved_at")} /></Field>
          </>
        ) : null}
        <Field label="Descripcion" wide><Textarea {...form.register("description")} /></Field>
        <Field label="Notas" wide><Textarea {...form.register("notes")} /></Field>
      </section>
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Clientes asociados</h2>
        <div className="flex flex-wrap gap-2">
          {clients.map((client) => {
            const checked = selectedClients.includes(client.id);
            return (
              <label key={client.id} className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <input type="checkbox" disabled={lockedClientId === client.id} checked={checked} onChange={(event) => {
                  const next = event.target.checked ? [...selectedClients, client.id] : selectedClients.filter((id) => id !== client.id);
                  form.setValue("client_ids", next, { shouldDirty: true, shouldValidate: true });
                }} />
                {client.name}
              </label>
            );
          })}
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Destinatarios</h2>
        <RecipientsField control={form.control} register={form.register} contacts={contacts} />
      </section>
      {submitError ? <Badge variant="warning">{submitError}</Badge> : null}
      <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : "Guardar reporte"}</Button>
    </form>
  );
}

function normalize(report?: Partial<ReportFormValues> | null, lockedClientId?: string): ReportFormValues {
  const clientIds = report?.client_ids || [];
  return { ...defaults, ...report, client_ids: lockedClientId && !clientIds.includes(lockedClientId) ? [...clientIds, lockedClientId] : clientIds, recipients: report?.recipients || [] };
}

function Field({ label, children, error, wide = false }: { label: string; children: React.ReactNode; error?: string; wide?: boolean }) {
  return <div className={wide ? "space-y-2 md:col-span-2" : "space-y-2"}><Label>{label}</Label>{children}{error ? <p className="text-xs text-destructive">{error}</p> : null}</div>;
}

function SelectField({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: readonly string[] }) {
  return <div className="space-y-2"><Label>{label}</Label><select {...props} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>;
}
