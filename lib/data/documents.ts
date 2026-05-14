import { createClient } from "@/lib/supabase/server";
import type { DocumentEntityType } from "@/lib/validators/document";

export const DOCUMENTS_BUCKET = "documents";

export type DocumentRow = {
  id: string;
  name: string;
  description: string | null;
  file_url: string | null;
  external_url: string | null;
  storage_path: string | null;
  mime_type: string | null;
  size: number | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  entity_type: DocumentEntityType;
  entity_id: string;
  document_type: string;
  source_type: "upload" | "external_link";
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string | null; email: string | null } | Array<{ full_name: string | null; email: string | null }> | null;
};

export type DocumentView = DocumentRow & {
  open_url: string | null;
  file_open_url: string | null;
  uploader_name: string | null;
  entity_label: string;
  entity_href: string;
};

export type EntityOption = {
  type: DocumentEntityType;
  id: string;
  label: string;
};

export async function getDocumentEntityOptions() {
  const supabase = await createClient();
  const [{ data: clients }, { data: contacts }, { data: tasks }, { data: interactions }, { data: reports }, { data: alerts }, { data: stakeholders }] = await Promise.all([
    supabase.from("clients").select("id, name").is("deleted_at", null).order("name"),
    supabase.from("contacts").select("id, full_name").is("deleted_at", null).order("full_name"),
    supabase.from("tasks").select("id, title").is("deleted_at", null).order("updated_at", { ascending: false }).limit(200),
    supabase.from("interactions").select("id, title").is("deleted_at", null).order("updated_at", { ascending: false }).limit(200),
    supabase.from("reports").select("id, title").is("deleted_at", null).order("updated_at", { ascending: false }).limit(200),
    supabase.from("alerts").select("id, title").is("deleted_at", null).order("updated_at", { ascending: false }).limit(200),
    supabase.from("stakeholders").select("id, full_name").is("deleted_at", null).order("full_name")
  ]);

  return [
    ...((clients || []) as Array<{ id: string; name: string }>).map((item) => ({ type: "client" as const, id: item.id, label: item.name })),
    ...((contacts || []) as Array<{ id: string; full_name: string }>).map((item) => ({ type: "contact" as const, id: item.id, label: item.full_name })),
    ...((tasks || []) as Array<{ id: string; title: string }>).map((item) => ({ type: "task" as const, id: item.id, label: item.title })),
    ...((interactions || []) as Array<{ id: string; title: string }>).map((item) => ({ type: "interaction" as const, id: item.id, label: item.title })),
    ...((reports || []) as Array<{ id: string; title: string }>).map((item) => ({ type: "report" as const, id: item.id, label: item.title })),
    ...((alerts || []) as Array<{ id: string; title: string }>).map((item) => ({ type: "alert" as const, id: item.id, label: item.title })),
    ...((stakeholders || []) as Array<{ id: string; full_name: string }>).map((item) => ({ type: "stakeholder" as const, id: item.id, label: item.full_name }))
  ] satisfies EntityOption[];
}

export async function getDocumentsForEntity(entityType: DocumentEntityType, entityId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("files")
    .select("*, profiles(full_name, email)")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return enrichDocuments((data || []) as unknown as DocumentRow[]);
}

export async function getAllDocuments() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("files")
    .select("*, profiles(full_name, email)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return enrichDocuments((data || []) as unknown as DocumentRow[]);
}

export async function getDocumentById(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("files").select("*, profiles(full_name, email)").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!data) return null;
  const [document] = await enrichDocuments([data as unknown as DocumentRow]);
  return document;
}

export async function enrichDocuments(rows: DocumentRow[]) {
  const supabase = await createClient();
  return Promise.all(rows.map(async (row) => {
    let fileOpenUrl = row.file_url || null;
    if (row.source_type === "upload" && row.storage_path) {
      const { data } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(row.storage_path, 60 * 60);
      fileOpenUrl = data?.signedUrl || fileOpenUrl;
    }
    const openUrl = row.source_type === "upload" ? fileOpenUrl : row.external_url;
    const profile = first(row.profiles);
    return {
      ...row,
      open_url: openUrl,
      file_open_url: fileOpenUrl,
      uploader_name: profile?.full_name || profile?.email || null,
      entity_label: `${entityTypeLabel(row.entity_type)} ${row.entity_id.slice(0, 8)}`,
      entity_href: entityHref(row.entity_type, row.entity_id)
    };
  }));
}

export function entityHref(entityType: DocumentEntityType, id: string) {
  const path = entityType === "client" ? "clients" : entityType === "interaction" ? "interactions" : `${entityType}s`;
  return `/${path}/${id}`;
}

export function entityTypeLabel(entityType: DocumentEntityType) {
  const labels: Record<DocumentEntityType, string> = {
    client: "Cliente",
    contact: "Contacto",
    task: "Tarea",
    interaction: "Interaccion",
    report: "Reporte",
    alert: "Alerta",
    stakeholder: "Stakeholder"
  };
  return labels[entityType];
}

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
