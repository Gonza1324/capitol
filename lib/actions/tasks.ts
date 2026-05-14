"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { taskCommentSchema, taskSchema, type TaskCommentValues, type TaskFormValues, type TaskStatus } from "@/lib/validators/task";
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
