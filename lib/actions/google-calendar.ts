"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertInternalRole, getCurrentProfile, logActivity, nullableString } from "@/lib/actions/helpers";
import {
  fetchGoogleCalendarEvents,
  getTokenExpiresAt,
  isGoogleCalendarEnabled,
  normalizeGoogleEvent,
  refreshGoogleAccessToken,
  shouldRefreshToken,
  type GoogleCalendarConnection
} from "@/lib/google/calendar";

type CalendarEventForInteraction = {
  id: string;
  google_event_id: string;
  summary: string | null;
  description: string | null;
  location: string | null;
  start_at: string | null;
  end_at: string | null;
  start_date: string | null;
  end_date: string | null;
  meet_url: string | null;
  hangout_link: string | null;
  client_id: string | null;
  interaction_id: string | null;
};

export async function disconnectGoogleCalendar() {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  await supabase.from("google_calendar_connections").delete().eq("user_id", user.id);

  await logActivity({
    supabase,
    actorId: user.id,
    action: "google_calendar_disconnected",
    entityType: "google_calendar_connection",
    entityId: user.id
  });

  revalidateCalendarPaths();
  redirect("/settings?toast=google_calendar_disconnected");
}

export async function syncGoogleCalendarEvents() {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  if (!isGoogleCalendarEnabled()) {
    redirect("/settings?toast=google_calendar_not_configured");
  }

  const { data: connection } = await supabase
    .from("google_calendar_connections")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!connection) {
    redirect("/settings?toast=google_calendar_not_connected");
  }

  const currentConnection = connection as unknown as GoogleCalendarConnection;
  const accessToken = await getValidAccessToken(currentConnection);
  const now = new Date();
  const timeMin = new Date(now);
  timeMin.setDate(timeMin.getDate() - 30);
  const timeMax = new Date(now);
  timeMax.setDate(timeMax.getDate() + 90);

  const events = await fetchGoogleCalendarEvents(accessToken, { timeMin, timeMax });
  const rows = events.map((event) => ({
    ...normalizeGoogleEvent(event),
    user_id: user.id,
    synced_at: new Date().toISOString(),
    deleted_at: null
  }));

  if (rows.length) {
    const { error } = await supabase
      .from("google_calendar_events")
      .upsert(rows, { onConflict: "user_id,google_event_id" });

    if (error) throw error;
  }

  await supabase
    .from("google_calendar_connections")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("user_id", user.id);

  await logActivity({
    supabase,
    actorId: user.id,
    action: "google_calendar_synced",
    entityType: "google_calendar_connection",
    entityId: currentConnection.id,
    metadata: { events_count: rows.length }
  });

  revalidateCalendarPaths();
  redirect("/calendar?toast=google_calendar_synced");

  async function getValidAccessToken(current: GoogleCalendarConnection) {
    if (!shouldRefreshToken(current.expires_at)) {
      return current.access_token;
    }

    if (!current.refresh_token) {
      redirect("/settings?toast=google_calendar_reconnect_required");
    }

    const refreshed = await refreshGoogleAccessToken(current.refresh_token);
    await supabase
      .from("google_calendar_connections")
      .update({
        access_token: refreshed.access_token,
        expires_at: getTokenExpiresAt(refreshed.expires_in),
        token_type: refreshed.token_type || current.token_type,
        scope: refreshed.scope || current.scope
      })
      .eq("user_id", user.id);

    return refreshed.access_token;
  }
}

export async function linkCalendarEventToClient(eventId: string, formData: FormData) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const clientId = nullableString(formData.get("client_id"));
  const { error } = await supabase
    .from("google_calendar_events")
    .update({ client_id: clientId })
    .eq("id", eventId)
    .eq("user_id", user.id);

  if (error) throw error;

  await logActivity({
    supabase,
    actorId: user.id,
    action: "google_calendar_event_linked",
    entityType: "google_calendar_event",
    entityId: eventId,
    metadata: { client_id: clientId }
  });

  revalidateCalendarPaths(clientId);
  redirect("/calendar?toast=google_calendar_event_linked");
}

export async function createInteractionFromCalendarEvent(eventId: string) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { data: event } = await supabase
    .from("google_calendar_events")
    .select("id, google_event_id, summary, description, location, start_at, end_at, start_date, end_date, meet_url, hangout_link, client_id, interaction_id")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!event) {
    redirect("/calendar?toast=error");
  }

  const calendarEvent = event as CalendarEventForInteraction;
  if (calendarEvent.interaction_id) {
    redirect(`/interactions/${calendarEvent.interaction_id}`);
  }

  const start = getDateAndTime(calendarEvent.start_at, calendarEvent.start_date);
  const end = getDateAndTime(calendarEvent.end_at, calendarEvent.end_date);
  const { data: interaction, error } = await supabase
    .from("interactions")
    .insert({
      type: "internal_meeting",
      title: calendarEvent.summary || "Evento de Google Calendar",
      description: calendarEvent.description,
      interaction_date: start.date,
      start_time: start.time,
      end_time: end.time,
      location: calendarEvent.location,
      google_calendar_event_id: calendarEvent.google_event_id,
      google_meet_url: calendarEvent.meet_url || calendarEvent.hangout_link,
      summary: calendarEvent.description,
      notes: null,
      decisions: null,
      risks: null,
      next_steps: null,
      created_by: user.id
    })
    .select("id")
    .single();

  if (error || !interaction) throw error || new Error("No pudimos crear la interaccion.");

  if (calendarEvent.client_id) {
    await supabase.from("interaction_clients").insert({ interaction_id: interaction.id, client_id: calendarEvent.client_id });
  }

  await supabase.from("interaction_internal_participants").insert({ interaction_id: interaction.id, user_id: user.id });
  await supabase
    .from("google_calendar_events")
    .update({ interaction_id: interaction.id })
    .eq("id", calendarEvent.id)
    .eq("user_id", user.id);

  await logActivity({
    supabase,
    actorId: user.id,
    action: "interaction_created_from_google_calendar",
    entityType: "interaction",
    entityId: interaction.id,
    metadata: { google_calendar_event_id: calendarEvent.google_event_id, source_event_id: calendarEvent.id }
  });

  revalidateCalendarPaths(calendarEvent.client_id);
  revalidatePath(`/interactions/${interaction.id}`);
  redirect(`/interactions/${interaction.id}?toast=interaction_created`);
}

function getDateAndTime(dateTime: string | null, fallbackDate: string | null) {
  if (!dateTime) return { date: fallbackDate || new Date().toISOString().slice(0, 10), time: null };
  const date = new Date(dateTime);
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

function revalidateCalendarPaths(clientId?: string | null) {
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  if (clientId) revalidatePath(`/clients/${clientId}`);
}
