"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertInternalRole, getCurrentProfile } from "@/lib/actions/helpers";

type ReminderCandidate = {
  type: string;
  title: string;
  body: string | null;
  entity_type: string;
  entity_id: string;
};

export async function markNotificationRead(id: string) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/notifications");
  redirect("/notifications?toast=notification_read");
}

export async function markAllNotificationsRead() {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) throw new Error(error.message);
  revalidatePath("/notifications");
  redirect("/notifications?toast=notifications_read");
}

export async function refreshInternalReminders() {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const week = new Date(now);
  week.setDate(week.getDate() + 7);
  const nextDay = new Date(now);
  nextDay.setDate(nextDay.getDate() + 1);

  const [{ data: taskRows }, { data: upcomingEvents }, { data: pendingInteractionEvents }] = await Promise.all([
    supabase
      .from("task_assignees")
      .select("tasks(id, title, due_date, status)")
      .eq("user_id", user.id)
      .not("tasks.status", "in", "(completed,cancelled)")
      .not("tasks.due_date", "is", null),
    supabase
      .from("internal_calendar_events")
      .select("id, title, start_at")
      .eq("assigned_to", user.id)
      .gte("start_at", now.toISOString())
      .lte("start_at", nextDay.toISOString())
      .not("status", "in", "(completed,cancelled)")
      .is("deleted_at", null),
    supabase
      .from("internal_calendar_events")
      .select("id, title, start_at")
      .eq("assigned_to", user.id)
      .lt("start_at", now.toISOString())
      .is("interaction_id", null)
      .not("status", "in", "(completed,cancelled)")
      .is("deleted_at", null)
  ]);

  const candidates: ReminderCandidate[] = [];
  ((taskRows || []) as Array<{ tasks: { id: string; title: string; due_date: string | null; status: string } | Array<{ id: string; title: string; due_date: string | null; status: string }> | null }>).forEach((row) => {
    const task = Array.isArray(row.tasks) ? row.tasks[0] : row.tasks;
    if (!task?.due_date) return;
    if (task.due_date < today) {
      candidates.push({
        type: "task_overdue",
        title: "Tarea vencida",
        body: `${task.title} vencio el ${task.due_date}`,
        entity_type: "task",
        entity_id: task.id
      });
    } else if (task.due_date <= week.toISOString().slice(0, 10)) {
      candidates.push({
        type: "task_due_soon",
        title: "Tarea proxima a vencer",
        body: `${task.title} vence el ${task.due_date}`,
        entity_type: "task",
        entity_id: task.id
      });
    }
  });

  ((upcomingEvents || []) as Array<{ id: string; title: string; start_at: string }>).forEach((event) => {
    candidates.push({
      type: "internal_calendar_event_upcoming",
      title: "Evento proximo",
      body: `${event.title} esta programado para ${formatDateTime(event.start_at)}`,
      entity_type: "internal_calendar_event",
      entity_id: event.id
    });
  });

  ((pendingInteractionEvents || []) as Array<{ id: string; title: string; start_at: string }>).forEach((event) => {
    candidates.push({
      type: "internal_calendar_event_pending_interaction",
      title: "Evento pendiente de interaccion",
      body: `${event.title} ya paso y no tiene interaccion registrada`,
      entity_type: "internal_calendar_event",
      entity_id: event.id
    });
  });

  const created = await insertMissingNotifications({ userId: user.id, candidates });
  revalidatePath("/notifications");
  redirect(`/notifications?toast=${created ? "notifications_refreshed" : "notifications_refreshed_empty"}`);

  async function insertMissingNotifications({ userId, candidates: rows }: { userId: string; candidates: ReminderCandidate[] }) {
    if (!rows.length) return 0;
    const { data: existing } = await supabase
      .from("notifications")
      .select("type, entity_id")
      .eq("user_id", userId)
      .in("entity_id", rows.map((row) => row.entity_id));

    const existingKeys = new Set(((existing || []) as Array<{ type: string; entity_id: string | null }>).map((row) => `${row.type}:${row.entity_id}`));
    const missing = rows.filter((row) => !existingKeys.has(`${row.type}:${row.entity_id}`));
    if (!missing.length) return 0;
    const { error } = await supabase.from("notifications").insert(missing.map((row) => ({ user_id: userId, ...row })));
    if (error) throw new Error(error.message);
    return missing.length;
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
