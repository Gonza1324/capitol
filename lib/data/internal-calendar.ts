import { createClient } from "@/lib/supabase/server";

export type InternalCalendarOption = { id: string; label: string; client_id?: string | null };

export type InternalCalendarEventRow = {
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
  interaction_id: string | null;
  created_by: string | null;
  assigned_to: string | null;
  source: string;
  sync_status: string;
  recurrence_rule: string | null;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
  clients?: { id: string; name: string } | { id: string; name: string }[] | null;
  contacts?: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
  stakeholders?: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
  tasks?: { id: string; title: string } | { id: string; title: string }[] | null;
  interactions?: { id: string; title: string } | { id: string; title: string }[] | null;
  profiles?: { id: string; full_name: string | null; email: string | null } | { id: string; full_name: string | null; email: string | null }[] | null;
};

export type CalendarTaskDeadlineRow = {
  id: string;
  title: string;
  due_date: string;
  priority: string;
  status: string;
  client_id: string | null;
  clients?: { id: string; name: string } | { id: string; name: string }[] | null;
};

export async function getInternalCalendarOptions() {
  const supabase = await createClient();
  const [{ data: clients }, { data: contacts }, { data: stakeholders }, { data: tasks }, { data: profiles }] = await Promise.all([
    supabase.from("clients").select("id, name").is("deleted_at", null).order("name"),
    supabase.from("contacts").select("id, full_name, client_id").is("deleted_at", null).order("full_name"),
    supabase.from("stakeholders").select("id, full_name").is("deleted_at", null).order("full_name"),
    supabase.from("tasks").select("id, title, client_id").is("deleted_at", null).not("status", "in", "(completed,cancelled)").order("updated_at", { ascending: false }).limit(300),
    supabase.from("profiles").select("id, full_name, email, role").in("role", ["admin", "partner_director", "analyst", "assistant"]).order("email")
  ]);

  return {
    clients: ((clients || []) as Array<{ id: string; name: string }>).map((item) => ({ id: item.id, label: item.name })),
    contacts: ((contacts || []) as Array<{ id: string; full_name: string; client_id: string | null }>).map((item) => ({ id: item.id, label: item.full_name, client_id: item.client_id })),
    stakeholders: ((stakeholders || []) as Array<{ id: string; full_name: string }>).map((item) => ({ id: item.id, label: item.full_name })),
    tasks: ((tasks || []) as Array<{ id: string; title: string; client_id: string | null }>).map((item) => ({ id: item.id, label: item.title, client_id: item.client_id })),
    profiles: ((profiles || []) as Array<{ id: string; full_name: string | null; email: string | null }>).map((item) => ({ id: item.id, label: item.full_name || item.email || "Usuario" }))
  };
}

export async function getInternalCalendarEvents({ from, to }: { from: string; to: string }) {
  const supabase = await createClient();
  const [{ data: events }, { data: tasks }] = await Promise.all([
    supabase
      .from("internal_calendar_events")
      .select("*, clients(id, name), contacts(id, full_name), stakeholders(id, full_name), tasks(id, title), interactions(id, title), profiles:assigned_to(id, full_name, email)")
      .gte("start_at", from)
      .lte("start_at", to)
      .is("deleted_at", null)
      .order("start_at", { ascending: true }),
    supabase
      .from("tasks")
      .select("id, title, due_date, priority, status, client_id, clients(id, name)")
      .gte("due_date", from.slice(0, 10))
      .lte("due_date", to.slice(0, 10))
      .not("status", "in", "(completed,cancelled)")
      .is("deleted_at", null)
      .order("due_date", { ascending: true })
  ]);

  return {
    events: (events || []) as unknown as InternalCalendarEventRow[],
    taskDeadlines: (tasks || []) as unknown as CalendarTaskDeadlineRow[]
  };
}
