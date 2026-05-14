"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { interactionSchema, type InteractionFormValues } from "@/lib/validators/interaction";
import { taskSchema, type TaskFormValues } from "@/lib/validators/task";
import { assertInternalRole, getCurrentProfile, logActivity } from "./helpers";
import { createTaskRecord } from "./tasks";

function interactionColumns(values: InteractionFormValues, userId: string) {
  return {
    type: values.type,
    title: values.title,
    description: values.description,
    interaction_date: values.interaction_date,
    start_time: values.start_time,
    end_time: values.end_time,
    location: values.location,
    google_calendar_event_id: values.google_calendar_event_id,
    google_meet_url: values.google_meet_url,
    summary: values.summary,
    notes: values.notes,
    decisions: values.decisions,
    risks: values.risks,
    next_steps: values.next_steps,
    updated_by: userId
  };
}

async function replaceInteractionRelations({
  supabase,
  interactionId,
  values,
  actorId
}: {
  supabase: Awaited<ReturnType<typeof getCurrentProfile>>["supabase"];
  interactionId: string;
  values: InteractionFormValues;
  actorId: string;
}) {
  const deletes = await Promise.all([
    supabase.from("interaction_clients").delete().eq("interaction_id", interactionId),
    supabase.from("interaction_internal_participants").delete().eq("interaction_id", interactionId),
    supabase.from("interaction_external_participants").delete().eq("interaction_id", interactionId)
  ]);
  const deleteError = deletes.find((result) => result.error)?.error;
  if (deleteError) throw new Error(deleteError.message);

  const inserts = [];
  if (values.client_ids.length) {
    inserts.push(
      supabase
        .from("interaction_clients")
        .insert(values.client_ids.map((clientId) => ({ interaction_id: interactionId, client_id: clientId })))
    );
  }
  if (values.internal_participant_ids.length) {
    inserts.push(
      supabase
        .from("interaction_internal_participants")
        .insert(values.internal_participant_ids.map((userId) => ({ interaction_id: interactionId, user_id: userId })))
    );
    await supabase.from("notifications").insert(
      values.internal_participant_ids
        .filter((userId) => userId !== actorId)
        .map((userId) => ({
          user_id: userId,
          type: "interaction_participant_added",
          title: "Nueva interaccion asignada",
          body: values.title,
          entity_type: "interaction",
          entity_id: interactionId
        }))
    );
  }
  if (values.external_participants.length) {
    inserts.push(
      supabase.from("interaction_external_participants").insert(
        values.external_participants.map((participant) => ({
          interaction_id: interactionId,
          contact_id: participant.contact_id,
          stakeholder_id: participant.stakeholder_id,
          name: participant.name,
          email: participant.email
        }))
      )
    );
  }

  if (inserts.length) {
    const results = await Promise.all(inserts);
    const insertError = results.find((result) => result.error)?.error;
    if (insertError) throw new Error(insertError.message);
  }

  await logActivity({
    supabase,
    actorId,
    action: "interaction_clients_updated",
    entityType: "interaction",
    entityId: interactionId,
    metadata: { client_ids: values.client_ids }
  });
  await logActivity({
    supabase,
    actorId,
    action: "interaction_participants_updated",
    entityType: "interaction",
    entityId: interactionId,
    metadata: {
      internal_participant_ids: values.internal_participant_ids,
      external_count: values.external_participants.length
    }
  });
  const stakeholderIds = Array.from(new Set(values.external_participants.flatMap((participant) => participant.stakeholder_id ? [participant.stakeholder_id] : [])));
  await Promise.all(stakeholderIds.map((stakeholderId) => logActivity({
    supabase,
    actorId,
    action: "stakeholder_interaction_created",
    entityType: "stakeholder",
    entityId: stakeholderId,
    metadata: { interaction_id: interactionId }
  })));
}

export async function createInteractionRecord(payload: InteractionFormValues, redirectTo?: string) {
  const values = interactionSchema.parse(payload);
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { data, error } = await supabase
    .from("interactions")
    .insert({
      ...interactionColumns(values, user.id),
      created_by: user.id
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await replaceInteractionRelations({ supabase, interactionId: data.id, values, actorId: user.id });
  await logActivity({
    supabase,
    actorId: user.id,
    action: "interaction_created",
    entityType: "interaction",
    entityId: data.id,
    metadata: { type: values.type }
  });

  revalidateInteractionPaths(data.id, values.client_ids);
  redirect(redirectTo || `/interactions/${data.id}?toast=interaction_created`);
}

export async function updateInteractionRecord(id: string, payload: InteractionFormValues, redirectTo?: string) {
  const values = interactionSchema.parse(payload);
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { error } = await supabase
    .from("interactions")
    .update(interactionColumns(values, user.id))
    .eq("id", id)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);

  await replaceInteractionRelations({ supabase, interactionId: id, values, actorId: user.id });
  await logActivity({
    supabase,
    actorId: user.id,
    action: "interaction_updated",
    entityType: "interaction",
    entityId: id,
    metadata: { type: values.type }
  });

  revalidateInteractionPaths(id, values.client_ids);
  redirect(redirectTo || `/interactions/${id}?toast=interaction_updated`);
}

export async function archiveInteractionRecord(id: string, clientIds: string[] = [], redirectTo?: string) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { error } = await supabase
    .from("interactions")
    .update({ deleted_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await logActivity({
    supabase,
    actorId: user.id,
    action: "interaction_archived",
    entityType: "interaction",
    entityId: id
  });

  revalidateInteractionPaths(id, clientIds);
  redirect(redirectTo || "/interactions?toast=interaction_archived");
}

export async function createDerivedTask(interactionId: string, payload: TaskFormValues) {
  const values = taskSchema.parse({
    ...payload,
    origin_type: "interaction",
    origin_id: interactionId
  });
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  await logActivity({
    supabase,
    actorId: user.id,
    action: "interaction_task_created",
    entityType: "interaction",
    entityId: interactionId,
    metadata: { title: values.title }
  });

  await createTaskRecord(values, `/interactions/${interactionId}?toast=interaction_task_created`);
}

function revalidateInteractionPaths(interactionId: string, clientIds: string[]) {
  revalidatePath("/interactions");
  revalidatePath("/stakeholders");
  revalidatePath(`/interactions/${interactionId}`);
  revalidatePath(`/interactions/${interactionId}/edit`);
  revalidatePath("/dashboard");
  clientIds.forEach((clientId) => revalidatePath(`/clients/${clientId}`));
}
