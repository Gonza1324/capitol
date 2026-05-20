"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertInternalRole, getCurrentProfile, logActivity } from "@/lib/actions/helpers";
import { buildOccurrenceDates, isRecurrenceRule, normalizeHorizon } from "@/lib/recurrence";
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
    recurrence_interval: values.is_recurring ? values.recurrence_interval || 1 : 1,
    recurrence_ends_at: values.is_recurring ? values.recurrence_ends_at : null,
    recurrence_count: values.is_recurring ? values.recurrence_count : null,
    next_occurrence_at: null,
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

  const { data: previous } = await supabase.from("internal_calendar_events").select("client_id, assigned_to, title").eq("id", id).maybeSingle();
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

  const previousEvent = previous as { client_id?: string | null; assigned_to?: string | null; title?: string | null } | null;
  if (previousEvent?.assigned_to && previousEvent.assigned_to !== user.id && ["postponed", "cancelled"].includes(status)) {
    await supabase.from("notifications").insert({
      user_id: previousEvent.assigned_to,
      type: status === "postponed" ? "internal_calendar_event_postponed" : "internal_calendar_event_cancelled",
      title: status === "postponed" ? "Evento pospuesto" : "Evento cancelado",
      body: previousEvent.title,
      entity_type: "internal_calendar_event",
      entity_id: id
    });
  }

  const clientId = previousEvent?.client_id;
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

export async function generateInternalCalendarOccurrences(eventId: string, horizonDays = 30, redirectTo?: string) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { data: event } = await supabase
    .from("internal_calendar_events")
    .select("*")
    .eq("id", eventId)
    .is("deleted_at", null)
    .maybeSingle();

  const parent = event as RecurringInternalCalendarEventRow | null;
  if (!parent || !parent.is_recurring || !isRecurrenceRule(parent.recurrence_rule)) {
    throw new Error("El evento no tiene una recurrencia valida para generar ocurrencias.");
  }

  const horizon = normalizeHorizon(horizonDays);
  const start = new Date(parent.start_at);
  const durationMs = parent.end_at ? new Date(parent.end_at).getTime() - start.getTime() : null;
  const dates = buildOccurrenceDates({
    start,
    rule: parent.recurrence_rule,
    interval: parent.recurrence_interval,
    horizonDays: horizon,
    endsAt: parent.recurrence_ends_at ? new Date(parent.recurrence_ends_at) : null,
    count: parent.recurrence_count
  });

  const { data: existingRows } = await supabase
    .from("internal_calendar_events")
    .select("start_at")
    .eq("generated_from_recurring_id", parent.id)
    .is("deleted_at", null);
  const existingStarts = new Set(((existingRows || []) as Array<{ start_at: string }>).map((row) => new Date(row.start_at).toISOString()));
  const newDates = dates.filter((date) => !existingStarts.has(date.toISOString()));

  if (!newDates.length) {
    redirect(redirectTo || `/internal-calendar/${eventId}?toast=recurrence_no_new_occurrences`);
  }

  const { data: inserted, error } = await supabase
    .from("internal_calendar_events")
    .insert(newDates.map((date) => ({
      title: parent.title,
      description: parent.description,
      notes: parent.notes,
      event_type: parent.event_type,
      status: "scheduled",
      start_at: date.toISOString(),
      end_at: durationMs && durationMs >= 0 ? new Date(date.getTime() + durationMs).toISOString() : null,
      all_day: parent.all_day,
      timezone: parent.timezone,
      location: parent.location,
      meeting_url: parent.meeting_url,
      client_id: parent.client_id,
      contact_id: parent.contact_id,
      stakeholder_id: parent.stakeholder_id,
      task_id: parent.task_id,
      assigned_to: parent.assigned_to,
      visibility: "internal",
      source: "internal",
      sync_status: "not_synced",
      is_recurring: false,
      recurrence_rule: null,
      recurrence_interval: 1,
      recurrence_ends_at: null,
      recurrence_count: null,
      parent_recurring_id: parent.id,
      generated_from_recurring_id: parent.id,
      created_by: user.id
    })))
    .select("id, start_at");

  if (error) throw new Error(error.message);

  const insertedRows = (inserted || []) as Array<{ id: string; start_at: string }>;
  const nextOccurrence = insertedRows.map((row) => row.start_at).sort()[0] || dates.find((date) => date.getTime() > Date.now())?.toISOString() || null;
  await supabase.from("internal_calendar_events").update({ next_occurrence_at: nextOccurrence }).eq("id", parent.id);

  if (parent.assigned_to && parent.assigned_to !== user.id && insertedRows.length) {
    await supabase.from("notifications").insert({
      user_id: parent.assigned_to,
      type: "internal_calendar_event_assigned",
      title: "Eventos recurrentes generados",
      body: parent.title,
      entity_type: "internal_calendar_event",
      entity_id: parent.id
    });
  }

  await logActivity({
    supabase,
    actorId: user.id,
    action: "internal_calendar_occurrences_generated",
    entityType: "internal_calendar_event",
    entityId: parent.id,
    metadata: { horizon_days: horizon, generated_count: insertedRows.length }
  });

  revalidateInternalCalendarPaths(parent.id, parent.client_id);
  insertedRows.forEach((row) => revalidatePath(`/internal-calendar/${row.id}`));
  redirect(redirectTo || `/internal-calendar/${eventId}?toast=internal_calendar_occurrences_generated`);
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

type RecurringInternalCalendarEventRow = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  event_type: string;
  status: string;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  timezone: string;
  location: string | null;
  meeting_url: string | null;
  client_id: string | null;
  contact_id: string | null;
  stakeholder_id: string | null;
  task_id: string | null;
  assigned_to: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  recurrence_interval: number | null;
  recurrence_ends_at: string | null;
  recurrence_count: number | null;
};
