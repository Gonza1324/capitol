"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { contactSchema, type ContactFormValues } from "@/lib/validators/contact";
import { assertInternalRole, getCurrentProfile, logActivity } from "./helpers";

function contactColumns(values: ContactFormValues, userId: string) {
  const fullName = `${values.first_name} ${values.last_name}`.trim();

  return {
    client_id: values.client_id,
    first_name: values.first_name || fullName,
    last_name: values.last_name || "",
    full_name: fullName,
    title: values.title,
    email: values.email,
    whatsapp: values.whatsapp,
    linkedin_url: values.linkedin_url,
    area: values.area,
    relationship_role: values.relationship_role,
    is_primary: values.is_primary,
    is_active: values.is_active,
    birthday: values.birthday,
    notes: values.notes,
    updated_by: userId
  };
}

async function clearOtherPrimaryContacts(
  supabase: Awaited<ReturnType<typeof getCurrentProfile>>["supabase"],
  clientId: string,
  exceptId?: string
) {
  let query = supabase.from("contacts").update({ is_primary: false }).eq("client_id", clientId).is("deleted_at", null);
  if (exceptId) query = query.neq("id", exceptId);
  const { error } = await query;
  if (error) throw new Error(error.message);
}

export async function createContactRecord(payload: ContactFormValues, redirectTo?: string) {
  const values = contactSchema.parse(payload);
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  if (values.is_primary) {
    await clearOtherPrimaryContacts(supabase, values.client_id);
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      ...contactColumns(values, user.id),
      created_by: user.id
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logActivity({
    supabase,
    actorId: user.id,
    action: "contact_created",
    entityType: "contact",
    entityId: data.id,
    metadata: { client_id: values.client_id }
  });

  revalidatePath("/contacts");
  revalidatePath(`/clients/${values.client_id}`);
  redirect(redirectTo || "/contacts?toast=contact_created");
}

export async function updateContactRecord(id: string, payload: ContactFormValues, redirectTo?: string) {
  const values = contactSchema.parse(payload);
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  if (values.is_primary) {
    await clearOtherPrimaryContacts(supabase, values.client_id, id);
  }

  const { error } = await supabase.from("contacts").update(contactColumns(values, user.id)).eq("id", id);
  if (error) throw new Error(error.message);

  await logActivity({
    supabase,
    actorId: user.id,
    action: "contact_updated",
    entityType: "contact",
    entityId: id,
    metadata: { client_id: values.client_id }
  });

  revalidatePath("/contacts");
  revalidatePath(`/clients/${values.client_id}`);
  redirect(redirectTo || "/contacts?toast=contact_updated");
}

export async function archiveContactRecord(id: string, clientId?: string) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { error } = await supabase.from("contacts").update({ deleted_at: new Date().toISOString(), updated_by: user.id }).eq("id", id);
  if (error) throw new Error(error.message);

  await logActivity({
    supabase,
    actorId: user.id,
    action: "contact_archived",
    entityType: "contact",
    entityId: id,
    metadata: clientId ? { client_id: clientId } : {}
  });

  revalidatePath("/contacts");
  if (clientId) revalidatePath(`/clients/${clientId}`);
  redirect(clientId ? `/clients/${clientId}?toast=contact_archived` : "/contacts?toast=contact_archived");
}
