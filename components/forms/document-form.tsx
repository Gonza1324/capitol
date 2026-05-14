"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileUp, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { documentEntityTypes, documentMetadataSchema, documentSourceTypes, documentTypes, type DocumentMetadataValues } from "@/lib/validators/document";
import type { EntityOption } from "@/lib/data/documents";

const defaults: DocumentMetadataValues = {
  name: "",
  description: "",
  document_type: "other",
  source_type: "upload",
  external_url: "",
  entity_type: "client",
  entity_id: ""
};

export function DocumentForm({
  action,
  document,
  entities,
  lockedEntityType,
  lockedEntityId,
  lockedSourceType,
  isEdit = false
}: {
  action: (formData: FormData) => Promise<void>;
  document?: Partial<DocumentMetadataValues> | null;
  entities: EntityOption[];
  lockedEntityType?: string;
  lockedEntityId?: string;
  lockedSourceType?: string;
  isEdit?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<DocumentMetadataValues>({
    resolver: zodResolver(documentMetadataSchema),
    defaultValues: {
      ...defaults,
      ...document,
      source_type: (lockedSourceType as DocumentMetadataValues["source_type"]) || document?.source_type || defaults.source_type,
      entity_type: (lockedEntityType as DocumentMetadataValues["entity_type"]) || document?.entity_type || defaults.entity_type,
      entity_id: lockedEntityId || document?.entity_id || ""
    }
  });
  const sourceType = form.watch("source_type");
  const entityType = form.watch("entity_type");
  const availableEntities = useMemo(() => entities.filter((entity) => entity.type === entityType), [entities, entityType]);

  function onSubmit(values: DocumentMetadataValues, event?: React.BaseSyntheticEvent) {
    setSubmitError(null);
    const target = event?.target as HTMLFormElement | undefined;
    if (!target) return;
    const data = new FormData(target);
    data.set("source_type", values.source_type);
    data.set("entity_type", values.entity_type);
    data.set("entity_id", values.entity_id);
    if (values.source_type === "upload" && !isEdit) {
      const file = data.get("file");
      if (!(file instanceof File) || file.size === 0) {
        setSubmitError("El archivo es obligatorio.");
        return;
      }
    }
    startTransition(async () => {
      try {
        await action(data);
      } catch (error) {
        const digest = typeof error === "object" && error && "digest" in error ? String(error.digest) : "";
        if (digest.startsWith("NEXT_REDIRECT")) throw error;
        setSubmitError(error instanceof Error ? error.message : "No pudimos guardar el documento.");
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <section className="grid gap-5 md:grid-cols-2">
        <Field label="Nombre" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} />
        </Field>
        <Field label="Tipo de documento">
          <select {...form.register("document_type")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            {documentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </Field>
        <Field label="Origen">
          <select
            {...form.register("source_type")}
            disabled={Boolean(lockedSourceType) || isEdit}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-70"
          >
            {documentSourceTypes.map((type) => <option key={type} value={type}>{type === "upload" ? "Archivo" : "Solo link externo"}</option>)}
          </select>
          {(lockedSourceType || isEdit) ? <input type="hidden" {...form.register("source_type")} /> : null}
        </Field>
        <Field label="Entidad">
          <select
            {...form.register("entity_type")}
            disabled={Boolean(lockedEntityType)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-70"
            onChange={(event) => {
              form.setValue("entity_type", event.target.value as DocumentMetadataValues["entity_type"], { shouldValidate: true });
              form.setValue("entity_id", "", { shouldValidate: true });
            }}
          >
            {documentEntityTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          {lockedEntityType ? <input type="hidden" {...form.register("entity_type")} /> : null}
        </Field>
        <Field label="Registro asociado" error={form.formState.errors.entity_id?.message}>
          <select
            {...form.register("entity_id")}
            disabled={Boolean(lockedEntityId)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-70"
          >
            <option value="">Seleccionar</option>
            {availableEntities.map((entity) => <option key={entity.id} value={entity.id}>{entity.label}</option>)}
          </select>
          {lockedEntityId ? <input type="hidden" {...form.register("entity_id")} /> : null}
        </Field>
        {sourceType === "external_link" ? (
          <Field label="URL externa" error={form.formState.errors.external_url?.message}>
            <Input placeholder="https://drive.google.com/..." {...form.register("external_url")} />
          </Field>
        ) : (
          <>
            <Field label="Archivo">
              {isEdit ? (
                <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">El reemplazo de archivo queda pendiente para una fase posterior.</div>
              ) : (
                <Input name="file" type="file" />
              )}
            </Field>
            <Field label="Link externo opcional" error={form.formState.errors.external_url?.message}>
              <Input placeholder="https://drive.google.com/..." {...form.register("external_url")} />
            </Field>
          </>
        )}
        <Field label="Descripcion" wide>
          <Textarea {...form.register("description")} />
        </Field>
      </section>

      {submitError ? <Badge variant="warning">{submitError}</Badge> : null}
      <Button type="submit" disabled={isPending}>
        {sourceType === "upload" ? <FileUp className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
        {isPending ? "Guardando..." : sourceType === "upload" ? "Subir archivo" : "Guardar link"}
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
