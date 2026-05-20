"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildOccurrenceDates, isRecurrenceRule, normalizeHorizon } from "@/lib/recurrence";
import { taskCommentSchema, taskPriorities, taskSchema, type TaskCommentValues, type TaskFormValues, type TaskPriority, type TaskStatus } from "@/lib/validators/task";
import { assertInternalRole, getCurrentProfile, logActivity } from "./helpers";

function taskColumns(values: TaskFormValues, userId: string) {
  return {
    title: values.title,
    description: values.description,
    client_id: values.client_id || null,
    status: values.status,
    priority: values.priority,
    due_date: values.due_date,
    origin_type: values.origin_type,
    origin_id: values.origin_id,
    is_recurring: values.is_recurring,
    recurrence_rule: values.is_recurring ? values.recurrence_rule : null,
    recurrence_interval: values.is_recurring ? values.recurrence_interval || 1 : 1,
    recurrence_ends_at: values.is_recurring ? values.recurrence_ends_at : null,
    recurrence_count: values.is_recurring ? values.recurrence_count : null,
    next_occurrence_at: null,
    completed_at: values.status === "completed" ? new Date().toISOString() : null,
    updated_by: userId
  };
}

async function replaceAssignees({
  supabase,
  taskId,
  assigneeIds,
  actorId,
  title
}: {
  supabase: Awaited<ReturnType<typeof getCurrentProfile>>["supabase"];
  taskId: string;
  assigneeIds: string[];
  actorId: string;
  title: string;
}) {
  const uniqueIds = Array.from(new Set(assigneeIds));
  const { data: previousRows } = await supabase.from("task_assignees").select("user_id").eq("task_id", taskId);
  const previousIds = new Set(((previousRows || []) as Array<{ user_id: string }>).map((row) => row.user_id));

  const { error: deleteError } = await supabase.from("task_assignees").delete().eq("task_id", taskId);
  if (deleteError) throw new Error(deleteError.message);

  if (uniqueIds.length) {
    const { error: insertError } = await supabase
      .from("task_assignees")
      .insert(uniqueIds.map((userId) => ({ task_id: taskId, user_id: userId })));
    if (insertError) throw new Error(insertError.message);
  }

  const newlyAssigned = uniqueIds.filter((userId) => !previousIds.has(userId));
  if (newlyAssigned.length) {
    await supabase.from("notifications").insert(
      newlyAssigned.map((userId) => ({
        user_id: userId,
        type: "task_assigned",
        title: "Nueva tarea asignada",
        body: title,
        entity_type: "task",
        entity_id: taskId
      }))
    );
  }

  await logActivity({
    supabase,
    actorId,
    action: "task_assignees_updated",
    entityType: "task",
    entityId: taskId,
    metadata: { assignee_ids: uniqueIds }
  });
}

async function maybeCreateInitialComment({
  supabase,
  taskId,
  body,
  actorId
}: {
  supabase: Awaited<ReturnType<typeof getCurrentProfile>>["supabase"];
  taskId: string;
  body: string | null;
  actorId: string;
}) {
  if (!body) return;
  const { data, error } = await supabase
    .from("task_comments")
    .insert({ task_id: taskId, body, created_by: actorId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await logActivity({
    supabase,
    actorId,
    action: "task_comment_created",
    entityType: "task_comment",
    entityId: data.id,
    metadata: { task_id: taskId }
  });
}

export async function createTaskRecord(payload: TaskFormValues, redirectTo?: string) {
  const values = taskSchema.parse(payload);
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      ...taskColumns(values, user.id),
      created_by: user.id
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await replaceAssignees({
    supabase,
    taskId: data.id,
    assigneeIds: values.assignee_ids,
    actorId: user.id,
    title: values.title
  });
  await maybeCreateInitialComment({ supabase, taskId: data.id, body: values.initial_comment, actorId: user.id });
  await logActivity({
    supabase,
    actorId: user.id,
    action: "task_created",
    entityType: "task",
    entityId: data.id,
    metadata: { client_id: values.client_id }
  });

  revalidateTaskPaths(data.id, values.client_id);
  redirect(redirectTo || `/tasks/${data.id}?toast=task_created`);
}

export async function updateTaskRecord(id: string, payload: TaskFormValues, redirectTo?: string) {
  const values = taskSchema.parse(payload);
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { data: previous } = await supabase.from("tasks").select("status, client_id").eq("id", id).maybeSingle();
  const { error } = await supabase.from("tasks").update(taskColumns(values, user.id)).eq("id", id).is("deleted_at", null);
  if (error) throw new Error(error.message);

  await replaceAssignees({
    supabase,
    taskId: id,
    assigneeIds: values.assignee_ids,
    actorId: user.id,
    title: values.title
  });
  await logActivity({
    supabase,
    actorId: user.id,
    action: "task_updated",
    entityType: "task",
    entityId: id,
    metadata: { client_id: values.client_id }
  });

  const previousStatus = (previous as { status?: string } | null)?.status;
  if (previousStatus && previousStatus !== values.status) {
    await logStatusActivity({ supabase, actorId: user.id, taskId: id, from: previousStatus, to: values.status });
  }

  revalidateTaskPaths(id, values.client_id || (previous as { client_id?: string | null } | null)?.client_id || null);
  redirect(redirectTo || `/tasks/${id}?toast=task_updated`);
}

export async function changeTaskStatus(id: string, status: TaskStatus, clientId?: string | null, redirectTo?: string) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { data: previous } = await supabase.from("tasks").select("status, client_id").eq("id", id).maybeSingle();
  const completedAt = status === "completed" ? new Date().toISOString() : null;
  const { error } = await supabase
    .from("tasks")
    .update({ status, completed_at: completedAt, updated_by: user.id })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  await logStatusActivity({
    supabase,
    actorId: user.id,
    taskId: id,
    from: (previous as { status?: string } | null)?.status,
    to: status
  });

  if (status === "completed") {
    const { data: assignees } = await supabase.from("task_assignees").select("user_id").eq("task_id", id);
    const assigneeIds = ((assignees || []) as Array<{ user_id: string }>).map((row) => row.user_id);
    if (assigneeIds.length) {
      await supabase.from("notifications").insert(
        assigneeIds.map((userId) => ({
          user_id: userId,
          type: "task_completed",
          title: "Tarea completada",
          entity_type: "task",
          entity_id: id
        }))
      );
    }
  }

  const relatedClientId = clientId || (previous as { client_id?: string | null } | null)?.client_id || null;
  revalidateTaskPaths(id, relatedClientId);
  redirect(redirectTo || `/tasks/${id}?toast=${status === "completed" ? "task_completed" : "task_status_changed"}`);
}

export async function changeTaskPriority(id: string, priority: TaskPriority, clientId?: string | null, redirectTo?: string) {
  if (!taskPriorities.includes(priority)) throw new Error("Prioridad invalida");
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { data: previous } = await supabase.from("tasks").select("client_id").eq("id", id).maybeSingle();
  const { error } = await supabase
    .from("tasks")
    .update({ priority, updated_by: user.id })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  await logActivity({
    supabase,
    actorId: user.id,
    action: "task_updated",
    entityType: "task",
    entityId: id,
    metadata: { priority }
  });

  const relatedClientId = clientId || (previous as { client_id?: string | null } | null)?.client_id || null;
  revalidateTaskPaths(id, relatedClientId);
  redirect(redirectTo || "/tasks?toast=task_updated");
}

export async function archiveTaskRecord(id: string, clientId?: string | null, redirectTo?: string) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { data: previous } = await supabase.from("tasks").select("client_id").eq("id", id).maybeSingle();
  const { error } = await supabase
    .from("tasks")
    .update({
      deleted_at: new Date().toISOString(),
      status: "cancelled",
      updated_by: user.id
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await logActivity({
    supabase,
    actorId: user.id,
    action: "task_archived",
    entityType: "task",
    entityId: id
  });

  const relatedClientId = clientId || (previous as { client_id?: string | null } | null)?.client_id || null;
  revalidateTaskPaths(id, relatedClientId);
  redirect(redirectTo || (relatedClientId ? `/clients/${relatedClientId}?toast=task_archived` : "/tasks?toast=task_archived"));
}

export async function generateTaskOccurrences(taskId: string, horizonDays = 30, redirectTo?: string) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .is("deleted_at", null)
    .maybeSingle();

  const parent = task as RecurringTaskRow | null;
  if (!parent || !parent.is_recurring || !isRecurrenceRule(parent.recurrence_rule) || !parent.due_date) {
    throw new Error("La tarea no tiene una recurrencia valida para generar ocurrencias.");
  }

  const horizon = normalizeHorizon(horizonDays);
  const dates = buildOccurrenceDates({
    start: new Date(`${parent.due_date}T00:00:00`),
    rule: parent.recurrence_rule,
    interval: parent.recurrence_interval,
    horizonDays: horizon,
    endsAt: parent.recurrence_ends_at ? new Date(`${parent.recurrence_ends_at}T23:59:59`) : null,
    count: parent.recurrence_count
  }).map((date) => date.toISOString().slice(0, 10));

  const { data: existingRows } = await supabase
    .from("tasks")
    .select("due_date")
    .eq("generated_from_recurring_id", parent.id)
    .is("deleted_at", null);
  const existingDates = new Set(((existingRows || []) as Array<{ due_date: string | null }>).map((row) => row.due_date).filter(Boolean));
  const newDates = dates.filter((date) => !existingDates.has(date));

  if (!newDates.length) {
    redirect(redirectTo || `/tasks/${taskId}?toast=recurrence_no_new_occurrences`);
  }

  const { data: assignees } = await supabase.from("task_assignees").select("user_id").eq("task_id", parent.id);
  const assigneeIds = ((assignees || []) as Array<{ user_id: string }>).map((row) => row.user_id);

  const { data: inserted, error } = await supabase
    .from("tasks")
    .insert(newDates.map((dueDate) => ({
      title: parent.title,
      description: parent.description,
      client_id: parent.client_id,
      status: "pending",
      priority: parent.priority,
      due_date: dueDate,
      origin_type: parent.origin_type,
      origin_id: parent.origin_id,
      is_recurring: false,
      recurrence_rule: null,
      recurrence_interval: 1,
      recurrence_ends_at: null,
      recurrence_count: null,
      parent_recurring_id: parent.id,
      generated_from_recurring_id: parent.id,
      created_by: user.id,
      updated_by: user.id
    })))
    .select("id, due_date");

  if (error) throw new Error(error.message);

  const insertedRows = (inserted || []) as Array<{ id: string; due_date: string | null }>;
  if (assigneeIds.length && insertedRows.length) {
    await supabase.from("task_assignees").insert(
      insertedRows.flatMap((row) => assigneeIds.map((userId) => ({ task_id: row.id, user_id: userId })))
    );
  }

  const nextOccurrence = insertedRows.map((row) => row.due_date).filter(Boolean).sort()[0] || dates.find((date) => date > new Date().toISOString().slice(0, 10)) || null;
  await supabase.from("tasks").update({ next_occurrence_at: nextOccurrence, updated_by: user.id }).eq("id", parent.id);

  await logActivity({
    supabase,
    actorId: user.id,
    action: "task_occurrences_generated",
    entityType: "task",
    entityId: parent.id,
    metadata: { horizon_days: horizon, generated_count: insertedRows.length }
  });

  revalidateTaskPaths(parent.id, parent.client_id);
  insertedRows.forEach((row) => revalidatePath(`/tasks/${row.id}`));
  redirect(redirectTo || `/tasks/${taskId}?toast=task_occurrences_generated`);
}

export async function createTaskComment(taskId: string, payload: TaskCommentValues) {
  const values = taskCommentSchema.parse(payload);
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { data, error } = await supabase
    .from("task_comments")
    .insert({ task_id: taskId, body: values.body, created_by: user.id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const { data: assignees } = await supabase.from("task_assignees").select("user_id").eq("task_id", taskId);
  const assigneeIds = ((assignees || []) as Array<{ user_id: string }>).map((row) => row.user_id).filter((id) => id !== user.id);
  if (assigneeIds.length) {
    await supabase.from("notifications").insert(
      assigneeIds.map((userId) => ({
        user_id: userId,
        type: "task_comment_added",
        title: "Nuevo comentario en tarea",
        body: values.body,
        entity_type: "task",
        entity_id: taskId
      }))
    );
  }

  await logActivity({
    supabase,
    actorId: user.id,
    action: "task_comment_created",
    entityType: "task_comment",
    entityId: data.id,
    metadata: { task_id: taskId }
  });

  revalidatePath(`/tasks/${taskId}`);
  redirect(`/tasks/${taskId}?toast=task_comment_created`);
}

async function logStatusActivity({
  supabase,
  actorId,
  taskId,
  from,
  to
}: {
  supabase: Awaited<ReturnType<typeof getCurrentProfile>>["supabase"];
  actorId: string;
  taskId: string;
  from?: string | null;
  to: string;
}) {
  const action = to === "completed" ? "task_completed" : from === "completed" ? "task_reopened" : "task_status_changed";
  await logActivity({
    supabase,
    actorId,
    action,
    entityType: "task",
    entityId: taskId,
    metadata: { from, to }
  });
}

function revalidateTaskPaths(taskId: string, clientId?: string | null) {
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath(`/tasks/${taskId}/edit`);
  revalidatePath("/dashboard");
  if (clientId) revalidatePath(`/clients/${clientId}`);
}

type RecurringTaskRow = {
  id: string;
  title: string;
  description: string | null;
  client_id: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  origin_type: string | null;
  origin_id: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  recurrence_interval: number | null;
  recurrence_ends_at: string | null;
  recurrence_count: number | null;
};
