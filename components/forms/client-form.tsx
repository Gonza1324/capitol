"use client";

import { useTransition, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { clientSchema, type ClientFormValues } from "@/lib/validators/client";

export type ClientFormClient = Partial<ClientFormValues> & { id?: string };
export type CatalogOption = { id: string; name: string };
export type ProfileOption = { id: string; label: string };

const statuses = ["active", "prospect", "paused", "former", "potential", "archived"] as const;
const types = ["company", "chamber", "ngo", "person", "public_agency", "embassy", "association", "other"] as const;
const confidentiality = ["standard", "confidential", "restricted"] as const;
const priorities = ["high", "medium", "low"] as const;

const emptyDefaults: ClientFormValues = {
  name: "",
  legal_name: "",
  tax_id: "",
  status: "prospect",
  client_type: "company",
  description: "",
  strategic_profile: "",
  start_date: "",
  end_date: "",
  confidentiality_level: "standard",
  website: "",
  drive_url: "",
  general_notes: "",
  industry_ids: [],
  interests: [],
  assignments: []
};

export function ClientForm({
  action,
  client,
  industries,
  interests,
  profiles
}: {
  action: (values: ClientFormValues) => Promise<void>;
  client?: ClientFormClient | null;
  industries: CatalogOption[];
  interests: CatalogOption[];
  profiles: ProfileOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: normalizeClientDefaults(client)
  });
  const interestFields = useFieldArray({ control: form.control, name: "interests" });
  const assignmentFields = useFieldArray({ control: form.control, name: "assignments" });
  const selectedIndustryIds = form.watch("industry_ids");
  const selectedInterests = form.watch("interests");

  function onSubmit(values: ClientFormValues) {
    setSubmitError(null);
    startTransition(async () => {
      try {
        await action(values);
      } catch (error) {
        const digest = typeof error === "object" && error && "digest" in error ? String(error.digest) : "";
        if (digest.startsWith("NEXT_REDIRECT")) throw error;
        setSubmitError(error instanceof Error ? error.message : "No pudimos guardar el cliente.");
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <Section title="Datos generales">
        <Field label="Nombre" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} />
        </Field>
        <Field label="Razon social">
          <Input {...form.register("legal_name")} />
        </Field>
        <Field label="CUIT / ID fiscal">
          <Input {...form.register("tax_id")} />
        </Field>
        <SelectField label="Estado" {...form.register("status")} options={statuses} />
        <SelectField label="Tipo de cliente" {...form.register("client_type")} options={types} />
        <SelectField label="Confidencialidad" {...form.register("confidentiality_level")} options={confidentiality} />
        <Field label="Fecha de inicio">
          <Input type="date" {...form.register("start_date")} />
        </Field>
        <Field label="Fecha de finalizacion" error={form.formState.errors.end_date?.message}>
          <Input type="date" {...form.register("end_date")} />
        </Field>
        <Field label="Website" error={form.formState.errors.website?.message}>
          <Input placeholder="https://..." {...form.register("website")} />
        </Field>
        <Field label="Link a Drive" error={form.formState.errors.drive_url?.message}>
          <Input placeholder="https://..." {...form.register("drive_url")} />
        </Field>
      </Section>

      <Section title="Estrategia y notas">
        <Field label="Descripcion" wide>
          <Textarea {...form.register("description")} />
        </Field>
        <Field label="Perfil estrategico" wide>
          <Textarea {...form.register("strategic_profile")} />
        </Field>
        <Field label="Notas generales" wide>
          <Textarea {...form.register("general_notes")} />
        </Field>
      </Section>

      <Section title="Rubros">
        <div className="md:col-span-2">
          <div className="flex flex-wrap gap-2">
            {industries.map((industry) => {
              const checked = selectedIndustryIds.includes(industry.id);
              return (
                <label key={industry.id} className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      const next = event.target.checked
                        ? [...selectedIndustryIds, industry.id]
                        : selectedIndustryIds.filter((id) => id !== industry.id);
                      form.setValue("industry_ids", next, { shouldDirty: true, shouldValidate: true });
                    }}
                  />
                  {industry.name}
                </label>
              );
            })}
            {!industries.length ? <p className="text-sm text-muted-foreground">Crea rubros en Configuracion para asignarlos.</p> : null}
          </div>
        </div>
      </Section>

      <Section title="Issues">
        <div className="space-y-3 md:col-span-2">
          {interests.map((interest) => {
            const index = selectedInterests.findIndex((item) => item.interest_id === interest.id);
            const checked = index >= 0;
            return (
              <div key={interest.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_9rem_10rem_10rem]">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      if (event.target.checked) {
                        interestFields.append({ interest_id: interest.id, priority: "medium", start_date: null, end_date: null });
                      } else if (index >= 0) {
                        interestFields.remove(index);
                      }
                    }}
                  />
                  {interest.name}
                </label>
                {checked ? (
                  <>
                    <select {...form.register(`interests.${index}.priority`)} className="h-9 rounded-md border bg-background px-2 text-sm">
                      {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                    </select>
                    <Input type="date" {...form.register(`interests.${index}.start_date`)} />
                    <Input type="date" {...form.register(`interests.${index}.end_date`)} />
                  </>
                ) : (
                  <div className="md:col-span-3" />
                )}
              </div>
            );
          })}
          {!interests.length ? <p className="text-sm text-muted-foreground">Crea issues en Configuracion para asignarlos.</p> : null}
        </div>
      </Section>

      <Section title="Responsables internos">
        <div className="space-y-3 md:col-span-2">
          {assignmentFields.fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_1fr_auto]">
              <select {...form.register(`assignments.${index}.user_id`)} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">Seleccionar usuario</option>
                {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>)}
              </select>
              <Input placeholder="Responsabilidad" {...form.register(`assignments.${index}.role`)} />
              <Button type="button" variant="ghost" size="icon" onClick={() => assignmentFields.remove(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => assignmentFields.append({ user_id: "", role: null })}>
            <Plus className="h-4 w-4" />
            Agregar responsable
          </Button>
        </div>
      </Section>

      {submitError ? <Badge variant="warning">{submitError}</Badge> : null}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar cliente"}
        </Button>
      </div>
    </form>
  );
}

function normalizeClientDefaults(client?: ClientFormClient | null): ClientFormValues {
  return {
    ...emptyDefaults,
    ...client,
    legal_name: client?.legal_name || "",
    tax_id: client?.tax_id || "",
    description: client?.description || "",
    strategic_profile: client?.strategic_profile || "",
    start_date: client?.start_date || "",
    end_date: client?.end_date || "",
    website: client?.website || "",
    drive_url: client?.drive_url || "",
    general_notes: client?.general_notes || "",
    industry_ids: client?.industry_ids || [],
    interests: client?.interests || [],
    assignments: client?.assignments || []
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="grid gap-5 md:grid-cols-2">{children}</div>
    </section>
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
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: readonly string[] }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select {...props} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}
