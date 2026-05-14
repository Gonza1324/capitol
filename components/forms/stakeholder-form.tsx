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
import { influenceLevels, sensitivityLevels, stakeholderSchema, stakeholderStances, stakeholderTypes, type StakeholderFormValues } from "@/lib/validators/stakeholder";

const defaults: StakeholderFormValues = {
  full_name: "",
  organization: "",
  title: "",
  email: "",
  phone: "",
  linkedin_url: "",
  type: "other",
  political_party: "",
  jurisdiction: "",
  influence_area: "",
  influence_level: "medium",
  stance: "unknown",
  sensitivity_level: "medium",
  notes: "",
  is_active: true,
  clients: [],
  topic_ids: []
};

export function StakeholderForm({
  action,
  stakeholder,
  clients,
  topics,
  lockedClientId
}: {
  action: (values: StakeholderFormValues) => Promise<void>;
  stakeholder?: Partial<StakeholderFormValues> | null;
  clients: Array<{ id: string; name: string }>;
  topics: Array<{ id: string; name: string }>;
  lockedClientId?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<StakeholderFormValues>({ resolver: zodResolver(stakeholderSchema), defaultValues: normalize(stakeholder, lockedClientId) });
  const clientFields = useFieldArray({ control: form.control, name: "clients" });
  const selectedTopics = form.watch("topic_ids");

  function onSubmit(values: StakeholderFormValues) {
    setSubmitError(null);
    startTransition(async () => {
      try {
        await action(values);
      } catch (error) {
        const digest = typeof error === "object" && error && "digest" in error ? String(error.digest) : "";
        if (digest.startsWith("NEXT_REDIRECT")) throw error;
        setSubmitError(error instanceof Error ? error.message : "No pudimos guardar el stakeholder.");
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <section className="grid gap-5 md:grid-cols-2">
        <Field label="Nombre completo" error={form.formState.errors.full_name?.message}><Input {...form.register("full_name")} /></Field>
        <Field label="Organizacion"><Input {...form.register("organization")} /></Field>
        <Field label="Cargo"><Input {...form.register("title")} /></Field>
        <Field label="Email" error={form.formState.errors.email?.message}><Input type="email" {...form.register("email")} /></Field>
        <Field label="Telefono"><Input {...form.register("phone")} /></Field>
        <Field label="LinkedIn" error={form.formState.errors.linkedin_url?.message}><Input placeholder="https://..." {...form.register("linkedin_url")} /></Field>
        <SelectField label="Tipo" options={stakeholderTypes} {...form.register("type")} />
        <Field label="Partido politico"><Input {...form.register("political_party")} /></Field>
        <Field label="Jurisdiccion"><Input {...form.register("jurisdiction")} /></Field>
        <Field label="Area de influencia"><Input {...form.register("influence_area")} /></Field>
        <SelectField label="Nivel de influencia" options={influenceLevels} {...form.register("influence_level")} />
        <SelectField label="Postura" options={stakeholderStances} {...form.register("stance")} />
        <SelectField label="Sensibilidad" options={sensitivityLevels} {...form.register("sensitivity_level")} />
        <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"><input type="checkbox" {...form.register("is_active")} />Activo</label>
        <Field label="Observaciones" wide><Textarea {...form.register("notes")} /></Field>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-base font-semibold">Clientes relacionados</h2><Button type="button" variant="outline" size="sm" onClick={() => clientFields.append({ client_id: "", relationship_description: "" })}><Plus className="h-4 w-4" />Agregar</Button></div>
        <div className="space-y-3">
          {clientFields.fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_1fr_auto]">
              <select {...form.register(`clients.${index}.client_id`)} disabled={lockedClientId === form.watch(`clients.${index}.client_id`)} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">Seleccionar cliente</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
              <Input placeholder="Descripcion de relacion" {...form.register(`clients.${index}.relationship_description`)} />
              <Button type="button" variant="ghost" size="icon" onClick={() => clientFields.remove(index)} disabled={lockedClientId === form.watch(`clients.${index}.client_id`)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold">Temas relacionados</h2>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => {
            const checked = selectedTopics.includes(topic.id);
            return <label key={topic.id} className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"><input type="checkbox" checked={checked} onChange={(event) => form.setValue("topic_ids", event.target.checked ? [...selectedTopics, topic.id] : selectedTopics.filter((id) => id !== topic.id), { shouldDirty: true, shouldValidate: true })} />{topic.name}</label>;
          })}
          {!topics.length ? <p className="text-sm text-muted-foreground">Sin temas configurados todavia.</p> : null}
        </div>
      </section>

      {submitError ? <Badge variant="warning">{submitError}</Badge> : null}
      <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : "Guardar stakeholder"}</Button>
    </form>
  );
}

function normalize(stakeholder?: Partial<StakeholderFormValues> | null, lockedClientId?: string): StakeholderFormValues {
  const clients = stakeholder?.clients || [];
  return {
    ...defaults,
    ...stakeholder,
    clients: lockedClientId && !clients.some((client) => client.client_id === lockedClientId) ? [...clients, { client_id: lockedClientId, relationship_description: "" }] : clients,
    topic_ids: stakeholder?.topic_ids || []
  };
}

function Field({ label, children, error, wide = false }: { label: string; children: React.ReactNode; error?: string; wide?: boolean }) {
  return <div className={wide ? "space-y-2 md:col-span-2" : "space-y-2"}><Label>{label}</Label>{children}{error ? <p className="text-xs text-destructive">{error}</p> : null}</div>;
}

function SelectField({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: readonly string[] }) {
  return <div className="space-y-2"><Label>{label}</Label><select {...props} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>;
}
