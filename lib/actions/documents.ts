"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DOCUMENTS_BUCKET, entityHref } from "@/lib/data/documents";
import { documentMetadataSchema, type DocumentEntityType } from "@/lib/validators/document";
import { assertInternalRole, getCurrentProfile, logActivity } from "./helpers";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function metadataFromFormData(formData: FormData) {
  return documentMetadataSchema.parse({
    name: stringValue(formData, "name"),
    description: stringValue(formData, "description"),
    document_type: stringValue(formData, "document_type"),
    source_type: stringValue(formData, "source_type"),
    external_url: stringValue(formData, "external_url"),
    entity_type: stringValue(formData, "entity_type"),
    entity_id: stringValue(formData, "entity_id")
  });
}

export async function createDocumentRecord(formData: FormData, redirectTo?: string) {
  const values = metadataFromFormData(formData);
  const file = formData.get("file");
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  let storagePath: string | null = null;
  let mimeType: string | null = null;
  let size: number | null = null;
  let fileUrl: string | null = null;
  let externalUrl: string | null = values.external_url;

  if (values.source_type === "upload") {
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("El archivo es obligatorio.");
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase();
    storagePath = `${values.entity_type}/${values.entity_id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(storagePath, file, {
      contentType: file.type || undefined,
      upsert: false
    });
    if (uploadError) throw new Error(uploadError.message);
    mimeType = file.type || null;
    size = file.size;
    fileUrl = storagePath;
    externalUrl = null;
  }

  const { data, error } = await supabase.from("files").insert({
    name: values.name,
    description: values.description,
    document_type: values.document_type,
    source_type: values.source_type,
    external_url: externalUrl,
    file_url: fileUrl,
    url: values.source_type === "external_link" ? externalUrl : fileUrl,
    storage_path: storagePath,
    mime_type: mimeType,
    size,
    size_bytes: size,
    uploaded_by: user.id,
    entity_type: values.entity_type,
    entity_id: values.entity_id
  }).select("id").single();
  if (error) throw new Error(error.message);

  await logActivity({
    supabase,
    actorId: user.id,
    action: values.source_type === "upload" ? "document_uploaded" : "document_link_created",
    entityType: "document",
    entityId: data.id,
    metadata: { entity_type: values.entity_type, entity_id: values.entity_id }
  });
  await logActivity({
    supabase,
    actorId: user.id,
    action: "document_created",
    entityType: values.entity_type,
    entityId: values.entity_id,
    metadata: { document_id: data.id, name: values.name }
  });

  revalidateDocumentPaths(data.id, values.entity_type, values.entity_id);
  redirect(redirectTo || `/documents/${data.id}?toast=document_created`);
}

export async function updateDocumentRecord(id: string, formData: FormData, redirectTo?: string) {
  const values = metadataFromFormData(formData);
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const updatePayload = {
    name: values.name,
    description: values.description,
    document_type: values.document_type,
    source_type: values.source_type,
    external_url: values.source_type === "external_link" ? values.external_url : null,
    url: values.source_type === "external_link" ? values.external_url : undefined,
    entity_type: values.entity_type,
    entity_id: values.entity_id
  };

  const { error } = await supabase.from("files").update(updatePayload).eq("id", id).is("deleted_at", null);
  if (error) throw new Error(error.message);

  await logActivity({
    supabase,
    actorId: user.id,
    action: "document_updated",
    entityType: "document",
    entityId: id,
    metadata: { entity_type: values.entity_type, entity_id: values.entity_id }
  });

  revalidateDocumentPaths(id, values.entity_type, values.entity_id);
  redirect(redirectTo || `/documents/${id}?toast=document_updated`);
}

export async function archiveDocumentRecord(id: string, entityType?: DocumentEntityType, entityId?: string, redirectTo?: string) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);
  const { error } = await supabase.from("files").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);

  await logActivity({ supabase, actorId: user.id, action: "document_archived", entityType: "document", entityId: id });
  if (entityType && entityId) {
    await logActivity({ supabase, actorId: user.id, action: "document_archived", entityType, entityId, metadata: { document_id: id } });
  }

  revalidateDocumentPaths(id, entityType, entityId);
  redirect(redirectTo || "/documents?toast=document_archived");
}

function revalidateDocumentPaths(id: string, entityType?: DocumentEntityType, entityId?: string) {
  revalidatePath("/documents");
  revalidatePath(`/documents/${id}`);
  revalidatePath(`/documents/${id}/edit`);
  revalidatePath("/dashboard");
  if (entityType && entityId) revalidatePath(entityHref(entityType, entityId));
}
