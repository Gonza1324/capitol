"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { contactSchema, type ContactFormValues } from "@/lib/validators/contact";

type Contact = Partial<ContactFormValues> & { id?: string };
type Client = { id: string; name: string };

const defaults: ContactFormValues = {
  client_id: "",
  first_name: "",
  last_name: "",
  title: "",
  email: "",
  whatsapp: "",
  linkedin_url: "",
  area: "",
  relationship_role: "",
  is_primary: false,
  is_active: true,
  birthday: "",
  notes: ""
};

export function ContactForm({
  action,
  contact,
  clients,
  lockedClientId
}: {
  action: (values: ContactFormValues) => Promise<void>;
  contact?: Contact | null;
  clients: Client[];
  lockedClientId?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      ...defaults,
      ...contact,
      client_id: lockedClientId || contact?.client_id || "",
      title: contact?.title || "",
      email: contact?.email || "",
      whatsapp: contact?.whatsapp || "",
      linkedin_url: contact?.linkedin_url || "",
      area: contact?.area || "",
      relationship_role: contact?.relationship_role || "",
      birthday: contact?.birthday || "",
      notes: contact?.notes || ""
    }
  });

  function onSubmit(values: ContactFormValues) {
    setSubmitError(null);
    startTransition(async () => {
      try {
        await action(values);
      } catch (error) {
        const digest = typeof error === "object" && error && "digest" in error ? String(error.digest) : "";
        if (digest.startsWith("NEXT_REDIRECT")) throw error;
        setSubmitError(error instanceof Error ? error.message : "No pudimos guardar el contacto.");
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="client_id">Cliente</Label>
        <select
          id="client_id"
          {...form.register("client_id")}
          disabled={Boolean(lockedClientId)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-70"
        >
          <option value="">Seleccionar cliente</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
        {lockedClientId ? <input type="hidden" {...form.register("client_id")} value={lockedClientId} /> : null}
        {form.formState.errors.client_id ? <p className="text-xs text-destructive">Seleccionar cliente</p> : null}
      </div>
      <Field label="Nombre" error={form.formState.errors.first_name?.message}>
        <Input {...form.register("first_name")} />
      </Field>
      <Field label="Apellido">
        <Input {...form.register("last_name")} />
      </Field>
      <Field label="Cargo">
        <Input {...form.register("title")} />
      </Field>
      <Field label="Email" error={form.formState.errors.email?.message}>
        <Input type="email" {...form.register("email")} />
      </Field>
      <Field label="WhatsApp">
        <Input {...form.register("whatsapp")} />
      </Field>
      <Field label="LinkedIn" error={form.formState.errors.linkedin_url?.message}>
        <Input placeholder="https://..." {...form.register("linkedin_url")} />
      </Field>
      <Field label="Area">
        <Input {...form.register("area")} />
      </Field>
      <Field label="Rol en la relacion">
        <Input {...form.register("relationship_role")} />
      </Field>
      <Field label="Cumpleanos">
        <Input type="date" {...form.register("birthday")} />
      </Field>
      <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
        <input type="checkbox" {...form.register("is_primary")} />
        Contacto principal
      </label>
      <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
        <input type="checkbox" {...form.register("is_active")} />
        Activo
      </label>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="notes">Observaciones</Label>
        <Textarea id="notes" {...form.register("notes")} />
      </div>
      {submitError ? <Badge variant="warning">{submitError}</Badge> : null}
      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar contacto"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
