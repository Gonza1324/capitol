import { createClient } from "@/lib/supabase/server";

export type CalendarConnectionPublic = {
  id: string;
  google_account_email: string | null;
  last_synced_at: string | null;
  connected_at: string;
};

export type CalendarEventRow = {
  id: string;
  user_id: string;
  google_event_id: string;
  summary: string | null;
  description: string | null;
  location: string | null;
  start_at: string | null;
  end_at: string | null;
  start_date: string | null;
  end_date: string | null;
  html_link: string | null;
  hangout_link: string | null;
  meet_url: string | null;
  status: string | null;
  organizer_email: string | null;
  client_id: string | null;
  interaction_id: string | null;
  updated_at: string;
  synced_at: string;
  clients?: { id: string; name: string } | { id: string; name: string }[] | null;
  interactions?: { id: string; title: string } | { id: string; title: string }[] | null;
};

export async function getCurrentCalendarConnection() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("google_calendar_connections")
    .select("id, google_account_email, last_synced_at, connected_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  return data as CalendarConnectionPublic | null;
}

export async function getCurrentUserCalendarEvents({ limit = 12, direction = "upcoming" }: { limit?: number; direction?: "upcoming" | "past" }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return [];

  const now = new Date().toISOString();
  const query = supabase
    .from("google_calendar_events")
    .select("id, user_id, google_event_id, summary, description, location, start_at, end_at, start_date, end_date, html_link, hangout_link, meet_url, status, organizer_email, client_id, interaction_id, updated_at, synced_at, clients(id, name), interactions(id, title)")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .limit(limit);

  if (direction === "upcoming") {
    query.gte("start_at", now).order("start_at", { ascending: true });
  } else {
    query.lt("start_at", now).order("start_at", { ascending: false });
  }

  const { data } = await query;
  return (data || []) as unknown as CalendarEventRow[];
}
