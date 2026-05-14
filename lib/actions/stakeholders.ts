"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { stakeholderSchema, type StakeholderFormValues } from "@/lib/validators/stakeholder";
import { assertInternalRole, getCurrentProfile, logActivity } from "./helpers";

function columns(values: StakeholderFormValues) {
  return {
    full_name: values.full_name,
    organization: values.organization,
    title: values.title,
    email: values.email,
    phone: values.phone,
    linkedin_url: values.linkedin_url,
    type: values.type,
    political_party: values.political_party,
    jurisdiction: values.jurisdiction,
    influence_area: values.influence_area,
    influence_level: values.influence_level,
    stance: values.stance,
    sensitivity_level: values.sensitivity_level,
    notes: values.notes,
    is_active: values.is_active
  };
}

async function replaceRelations({
  supabase,
  stakeholderId,
  values,
  actorId
}: {
  supabase: Awaited<ReturnType<typeof getCurrentProfile>>["supabase"];
  stakeholderId: string;
  values: StakeholderFormValues;
  actorId: string;
}) {
  const deletes = await Promise.all([
    supabase.from("stakeholder_clients").delete().eq("stakeholder_id", stakeholderId),
    supabase.from("stakeholder_topics").delete().eq("stakeholder_id", stakeholderId)
  ]);
  const deleteError = deletes.find((result) => result.error)?.error;
  if (deleteError) throw new Error(deleteError.message);

  const inserts = [];
  if (values.clients.length) {
    inserts.push(supabase.from("stakeholder_clients").insert(values.clients.map((client) => ({
      stakeholder_id: stakeholderId,
      client_id: client.client_id,
      relationship_description: client.relationship_description
    }))));
  }
  if (values.topic_ids.length) {
    inserts.push(supabase.from("stakeholder_topics").insert(values.topic_ids.map((topicId) => ({
      stakeholder_id: stakeholderId,
      topic_id: topicId
    }))));
  }
  if (inserts.length) {
    const results = await Promise.all(inserts);
    const insertError = results.find((result) => result.error)?.error;
    if (insertError) throw new Error(insertError.message);
  }

  await logActivity({ supabase, actorId, action: "stakeholder_clients_updated", entityType: "stakeholder", entityId: stakeholderId, metadata: { client_ids: values.clients.map((client) => client.client_id) } });
  await logActivity({ supabase, actorId, action: "stakeholder_topics_updated", entityType: "stakeholder", entityId: stakeholderId, metadata: { topic_ids: values.topic_ids } });
}

async function notifyRestricted(supabase: Awaited<ReturnType<typeof getCurrentProfile>>["supabase"], stakeholderId: string, values: StakeholderFormValues) {
  if (values.sensitivity_level !== "restricted") return;
  const { data } = await supabase.from("profiles").select("id").in("role", ["admin", "partner_director"]);
  const ids = ((data || []) as Array<{ id: string }>).map((profile) => profile.id);
  if (!ids.length) return;
  await supabase.from("notifications").insert(ids.map((userId) => ({
    user_id: userId,
    type: "restricted_stakeholder_created",
    title: "Stakeholder restringido",
    body: values.full_name,
    entity_type: "stakeholder",
    entity_id: stakeholderId
  })));
}

export async function createStakeholderRecord(payload: StakeholderFormValues, redirectTo?: string) {
  const values = stakeholderSchema.parse(payload);
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);
  const { data, error } = await supabase.from("stakeholders").insert(columns(values)).select("id").single();
  if (error) throw new Error(error.message);
  await replaceRelations({ supabase, stakeholderId: data.id, values, actorId: user.id });
  await notifyRestricted(supabase, data.id, values);
  await logActivity({ supabase, actorId: user.id, action: "stakeholder_created", entityType: "stakeholder", entityId: data.id });
  revalidateStakeholderPaths(data.id, values.clients.map((client) => client.client_id));
  redirect(redirectTo || `/stakeholders/${data.id}?toast=stakeholder_created`);
}

export async function updateStakeholderRecord(id: string, payload: StakeholderFormValues, redirectTo?: string) {
  const values = stakeholderSchema.parse(payload);
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);
  const { error } = await supabase.from("stakeholders").update(columns(values)).eq("id", id).is("deleted_at", null);
  if (error) throw new Error(error.message);
  await replaceRelations({ supabase, stakeholderId: id, values, actorId: user.id });
  await logActivity({ supabase, actorId: user.id, action: "stakeholder_updated", entityType: "stakeholder", entityId: id });
  revalidateStakeholderPaths(id, values.clients.map((client) => client.client_id));
  redirect(redirectTo || `/stakeholders/${id}?toast=stakeholder_updated`);
}

export async function archiveStakeholderRecord(id: string, clientIds: string[] = [], redirectTo?: string) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);
  const { error } = await supabase.from("stakeholders").update({ deleted_at: new Date().toISOString(), is_active: false }).eq("id", id);
  if (error) throw new Error(error.message);
  await logActivity({ supabase, actorId: user.id, action: "stakeholder_archived", entityType: "stakeholder", entityId: id });
  revalidateStakeholderPaths(id, clientIds);
  redirect(redirectTo || "/stakeholders?toast=stakeholder_archived");
}

export async function logStakeholderInteractionCreated(stakeholderId: string, interactionId: string) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);
  await logActivity({ supabase, actorId: user.id, action: "stakeholder_interaction_created", entityType: "stakeholder", entityId: stakeholderId, metadata: { interaction_id: interactionId } });
}

function revalidateStakeholderPaths(id: string, clientIds: string[]) {
  revalidatePath("/stakeholders");
  revalidatePath(`/stakeholders/${id}`);
  revalidatePath(`/stakeholders/${id}/edit`);
  revalidatePath("/dashboard");
  clientIds.forEach((clientId) => revalidatePath(`/clients/${clientId}`));
}
