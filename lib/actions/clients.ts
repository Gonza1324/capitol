"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { catalogItemSchema, clientSchema, type ClientFormValues } from "@/lib/validators/client";
import { assertInternalRole, getCurrentProfile, logActivity } from "./helpers";

type RedirectMode = "list" | "detail";

function cleanUnique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

async function replaceClientRelations(
  supabase: Awaited<ReturnType<typeof getCurrentProfile>>["supabase"],
  clientId: string,
  values: ClientFormValues
) {
  const industryIds = cleanUnique(values.industry_ids);
  const assignments = values.assignments.filter((assignment) => assignment.user_id);
  const interests = values.interests.filter((interest) => interest.interest_id);

  const relationOps = [
    supabase.from("client_industries").delete().eq("client_id", clientId),
    supabase.from("client_interests").delete().eq("client_id", clientId),
    supabase.from("client_assignments").delete().eq("client_id", clientId)
  ];

  const relationResults = await Promise.all(relationOps);
  const relationError = relationResults.find((result) => result.error)?.error;
  if (relationError) throw new Error(relationError.message);

  const inserts = [];
  if (industryIds.length) {
    inserts.push(
      supabase.from("client_industries").insert(
        industryIds.map((industryId) => ({
          client_id: clientId,
          industry_id: industryId
        }))
      )
    );
  }

  if (interests.length) {
    inserts.push(
      supabase.from("client_interests").insert(
        interests.map((interest) => ({
          client_id: clientId,
          interest_id: interest.interest_id,
          priority: interest.priority,
          start_date: interest.start_date,
          end_date: interest.end_date
        }))
      )
    );
  }

  if (assignments.length) {
    inserts.push(
      supabase.from("client_assignments").insert(
        assignments.map((assignment) => ({
          client_id: clientId,
          user_id: assignment.user_id,
          role: assignment.role
        }))
      )
    );
  }

  if (inserts.length) {
    const insertResults = await Promise.all(inserts);
    const insertError = insertResults.find((result) => result.error)?.error;
    if (insertError) throw new Error(insertError.message);
  }
}

function clientColumns(values: ClientFormValues, userId: string) {
  return {
    name: values.name,
    legal_name: values.legal_name,
    tax_id: values.tax_id,
    status: values.status,
    client_type: values.client_type,
    description: values.description,
    strategic_profile: values.strategic_profile,
    start_date: values.start_date,
    end_date: values.end_date,
    confidentiality_level: values.confidentiality_level,
    website: values.website,
    drive_url: values.drive_url,
    general_notes: values.general_notes,
    updated_by: userId
  };
}

export async function createClientRecord(payload: ClientFormValues) {
  const values = clientSchema.parse(payload);
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { data, error } = await supabase
    .from("clients")
    .insert({
      ...clientColumns(values, user.id),
      created_by: user.id
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await replaceClientRelations(supabase, data.id, values);
  await logActivity({
    supabase,
    actorId: user.id,
    action: "client_created",
    entityType: "client",
    entityId: data.id,
    metadata: { name: values.name }
  });

  revalidatePath("/clients");
  redirect(`/clients/${data.id}?toast=client_created`);
}

export async function updateClientRecord(id: string, payload: ClientFormValues, redirectMode: RedirectMode = "detail") {
  const values = clientSchema.parse(payload);
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { error } = await supabase.from("clients").update(clientColumns(values, user.id)).eq("id", id).is("deleted_at", null);
  if (error) throw new Error(error.message);

  await replaceClientRelations(supabase, id, values);
  await logActivity({
    supabase,
    actorId: user.id,
    action: "client_updated",
    entityType: "client",
    entityId: id,
    metadata: { name: values.name }
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect(redirectMode === "list" ? "/clients?toast=client_updated" : `/clients/${id}?toast=client_updated`);
}

export async function archiveClientRecord(id: string) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { error } = await supabase
    .from("clients")
    .update({ deleted_at: new Date().toISOString(), status: "archived", updated_by: user.id })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await logActivity({
    supabase,
    actorId: user.id,
    action: "client_archived",
    entityType: "client",
    entityId: id
  });

  revalidatePath("/clients");
  redirect("/clients?toast=client_archived");
}

export async function createCatalogItem(kind: "industry" | "interest", payload: { name: string }) {
  const values = catalogItemSchema.parse(payload);
  const { supabase, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const table = kind === "industry" ? "industries" : "interests";
  const { error } = await supabase.from(table).insert({ name: values.name });
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  redirect("/settings?toast=catalog_updated");
}
