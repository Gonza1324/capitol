"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertInternalRole, getCurrentProfile, logActivity } from "@/lib/actions/helpers";
import { internalCalendarEventSchema, type InternalCalendarEventValues, type InternalCalendarStatus } from "@/lib/validators/internal-calendar";

function eventColumns(values: InternalCalendarEventValues, userId: string) {
  return {
    title: values.title,
    description: values.description,
    notes: values.notes,
    event_type: values.event_type,
    status: values.status,
    start_at: values.start_at,
    end_at: values.end_at,
    all_day: values.all_day,
    location: values.location,
    meeting_url: values.meeting_url,
    client_id: values.client_id,
    contact_id: values.contact_id,
    stakeholder_id: values.stakeholder_id,
    task_id: values.task_id,
    assigned_to: values.assigned_to,
    is_recurring: values.is_recurring,
    recurrence_rule: values.is_recurring ? values.recurrence_rule : null,
    timezone: "America/Argentina/Buenos_Aires",
    visibility: "internal",
    source: "internal",
    sync_status: "not_synced",
    created_by: userId
  };
}

export async function createInternalCalendarEvent(payload: InternalCalendarEventValues, redirectTo?: string) {
  const values = internalCalendarEventSchema.parse(payload);
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { data, error } = await supabase
    .from("internal_calendar_events")
    .insert(eventColumns(values, user.id))
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (values.assigned_to && values.assigned_to !== user.id) {
    await supabase.from("notifications").insert({
      user_id: values.assigned_to,
      type: "internal_calendar_event_assigned",
      title: "Nuevo evento asignado",
      body: values.title,
      entity_type: "internal_calendar_event",
      entity_id: data.id
    });
  }

  await logActivity({
    supabase,
    actorId: user.id,
    action: "internal_calendar_event_created",
    entityType: "internal_calendar_event",
    entityId: data.id,
    metadata: { client_id: values.client_id, event_type: values.event_type }
  });

  revalidateInternalCalendarPaths(data.id, values.client_id);
  redirect(redirectTo || `/internal-calendar/${data.id}?toast=internal_calendar_event_created`);
}

export async function updateInternalCalendarEvent(id: string, payload: InternalCalendarEventValues, redirectTo?: string) {
  const values = internalCalendarEventSchema.parse(payload);
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { data: previous } = await supabase.from("internal_calendar_events").select("client_id, assigned_to").eq("id", id).maybeSingle();
  const { error } = await supabase
    .from("internal_calendar_events")
    .update(eventColumns(values, user.id))
    .eq("id", id)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  const previousAssignedTo = (previous as { assigned_to?: string | null } | null)?.assigned_to;
  if (values.assigned_to && values.assigned_to !== user.id && values.assigned_to !== previousAssignedTo) {
    await supabase.from("notifications").insert({
      user_id: values.assigned_to,
      type: "internal_calendar_event_assigned",
      title: "Evento asignado",
      body: values.title,
      entity_type: "internal_calendar_event",
      entity_id: id
    });
  }

  await logActivity({
    supabase,
    actorId: user.id,
    action: "internal_calendar_event_updated",
    entityType: "internal_calendar_event",
    entityId: id,
    metadata: { client_id: values.client_id, event_type: values.event_type }
  });

  revalidateInternalCalendarPaths(id, values.client_id || (previous as { client_id?: string | null } | null)?.client_id);
  redirect(redirectTo || `/internal-calendar/${id}?toast=internal_calendar_event_updated`);
}

export async function changeInternalCalendarEventStatus(id: string, status: InternalCalendarStatus, redirectTo?: string) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { data: previous } = await supabase.from("internal_calendar_events").select("client_id").eq("id", id).maybeSingle();
  const { error } = await supabase
    .from("internal_calendar_events")
    .update({ status })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  const action = status === "completed"
    ? "internal_calendar_event_completed"
    : status === "cancelled"
      ? "internal_calendar_event_cancelled"
      : status === "postponed"
        ? "internal_calendar_event_postponed"
        : "internal_calendar_event_updated";

  await logActivity({
    supabase,
    actorId: user.id,
    action,
    entityType: "internal_calendar_event",
    entityId: id
  });

  const clientId = (previous as { client_id?: string | null } | null)?.client_id;
  revalidateInternalCalendarPaths(id, clientId);
  redirect(redirectTo || `/internal-calendar/${id}?toast=${action}`);
}

export async function archiveInternalCalendarEvent(id: string, redirectTo?: string) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { data: previous } = await supabase.from("internal_calendar_events").select("client_id").eq("id", id).maybeSingle();
  const { error } = await supabase
    .from("internal_calendar_events")
    .update({ deleted_at: new Date().toISOString(), status: "cancelled" })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await logActivity({
    supabase,
    actorId: user.id,
    action: "internal_calendar_event_cancelled",
    entityType: "internal_calendar_event",
    entityId: id
  });

  revalidateInternalCalendarPaths(id, (previous as { client_id?: string | null } | null)?.client_id);
  redirect(redirectTo || "/internal-calendar?toast=internal_calendar_event_cancelled");
}

export async function createInteractionFromInternalCalendarEvent(eventId: string) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { data: event } = await supabase
    .from("internal_calendar_events")
    .select("*")
    .eq("id", eventId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!event) redirect("/internal-calendar?toast=error");
  const detail = event as {
    id: string;
    title: string;
    description: string | null;
    event_type: string;
    start_at: string;
    end_at: string | null;
    location: string | null;
    meeting_url: string | null;
    client_id: string | null;
    contact_id: string | null;
    stakeholder_id: string | null;
    interaction_id: string | null;
  };

  if (detail.interaction_id) redirect(`/interactions/${detail.interaction_id}`);

  const start = splitDateTime(detail.start_at);
  const end = detail.end_at ? splitDateTime(detail.end_at) : { time: null };
  const interactionType = detail.event_type === "call"
    ? "call"
    : detail.event_type === "internal_meeting"
      ? "internal_meeting"
      : "in_person_meeting";

  const { data: interaction, error } = await supabase
    .from("interactions")
    .insert({
      type: interactionType,
      title: detail.title,
      description: detail.description,
      interaction_date: start.date,
      start_time: start.time,
      end_time: end.time,
      location: detail.location,
      google_meet_url: detail.meeting_url,
      summary: detail.description,
      created_by: user.id,
      updated_by: user.id
    })
    .select("id")
    .single();

  if (error || !interaction) throw error || new Error("No pudimos crear la interaccion.");

  if (detail.client_id) {
    await supabase.from("interaction_clients").insert({ interaction_id: interaction.id, client_id: detail.client_id });
  }
  await supabase.from("interaction_internal_participants").insert({ interaction_id: interaction.id, user_id: user.id });
  if (detail.contact_id || detail.stakeholder_id) {
    await supabase.from("interaction_external_participants").insert({
      interaction_id: interaction.id,
      contact_id: detail.contact_id,
      stakeholder_id: detail.stakeholder_id
    });
  }
  await supabase.from("internal_calendar_events").update({ interaction_id: interaction.id }).eq("id", detail.id);

  await logActivity({
    supabase,
    actorId: user.id,
    action: "interaction_created_from_internal_calendar_event",
    entityType: "interaction",
    entityId: interaction.id,
    metadata: { internal_calendar_event_id: detail.id }
  });

  revalidateInternalCalendarPaths(detail.id, detail.client_id);
  revalidatePath(`/interactions/${interaction.id}`);
  redirect(`/interactions/${interaction.id}?toast=interaction_created`);
}

function splitDateTime(value: string) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
  const [formattedDate, formattedTime] = parts.split(" ");
  return { date: formattedDate, time: formattedTime || null };
}

function revalidateInternalCalendarPaths(eventId: string, clientId?: string | null) {
  revalidatePath("/internal-calendar");
  revalidatePath(`/internal-calendar/${eventId}`);
  revalidatePath(`/internal-calendar/${eventId}/edit`);
  revalidatePath("/dashboard");
  if (clientId) revalidatePath(`/clients/${clientId}`);
}
