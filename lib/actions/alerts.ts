"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { alertSchema, type AlertFormValues } from "@/lib/validators/alert";
import { taskSchema, type TaskFormValues } from "@/lib/validators/task";
import { assertInternalRole, getCurrentProfile, logActivity } from "./helpers";
import { createTaskRecord } from "./tasks";

function alertColumns(values: AlertFormValues) {
  return {
    title: values.title,
    category: values.category,
    urgency: values.urgency,
    description: values.description,
    content: values.content,
    sent_at: values.sent_at,
    medium: values.medium,
    responsible_id: values.responsible_id,
    attachment_url: values.attachment_url,
    notes: values.notes,
    is_client_visible: false
  };
}

async function replaceAlertRelations({ supabase, alertId, values, actorId }: { supabase: Awaited<ReturnType<typeof getCurrentProfile>>["supabase"]; alertId: string; values: AlertFormValues; actorId: string }) {
  const deletes = await Promise.all([
    supabase.from("alert_clients").delete().eq("alert_id", alertId),
    supabase.from("alert_industries").delete().eq("alert_id", alertId),
    supabase.from("alert_interests").delete().eq("alert_id", alertId),
    supabase.from("alert_recipients").delete().eq("alert_id", alertId)
  ]);
  const deleteError = deletes.find((result) => result.error)?.error;
  if (deleteError) throw new Error(deleteError.message);

  const inserts = [];
  if (values.client_ids.length) inserts.push(supabase.from("alert_clients").insert(values.client_ids.map((clientId) => ({ alert_id: alertId, client_id: clientId }))));
  if (values.industry_ids.length) inserts.push(supabase.from("alert_industries").insert(values.industry_ids.map((industryId) => ({ alert_id: alertId, industry_id: industryId }))));
  if (values.interest_ids.length) inserts.push(supabase.from("alert_interests").insert(values.interest_ids.map((interestId) => ({ alert_id: alertId, interest_id: interestId }))));
  if (values.recipients.length) inserts.push(supabase.from("alert_recipients").insert(values.recipients.map((recipient) => ({ alert_id: alertId, contact_id: recipient.contact_id, name: recipient.name, email: recipient.email }))));
  if (inserts.length) {
    const results = await Promise.all(inserts);
    const insertError = results.find((result) => result.error)?.error;
    if (insertError) throw new Error(insertError.message);
  }

  await logActivity({ supabase, actorId, action: "alert_clients_updated", entityType: "alert", entityId: alertId, metadata: { client_ids: values.client_ids } });
  await logActivity({ supabase, actorId, action: "alert_recipients_updated", entityType: "alert", entityId: alertId, metadata: { count: values.recipients.length } });
}

async function notifyCriticalAlert(supabase: Awaited<ReturnType<typeof getCurrentProfile>>["supabase"], alertId: string, values: AlertFormValues) {
  if (values.urgency !== "critical") return;
  const { data: profiles } = await supabase.from("profiles").select("id").in("role", ["admin", "partner_director"]);
  const ids = ((profiles || []) as Array<{ id: string }>).map((profile) => profile.id);
  if (!ids.length) return;
  await supabase.from("notifications").insert(ids.map((userId) => ({
    user_id: userId,
    type: "critical_alert_created",
    title: "Alerta critica registrada",
    body: values.title,
    entity_type: "alert",
    entity_id: alertId
  })));
}

export async function createAlertRecord(payload: AlertFormValues, redirectTo?: string) {
  const values = alertSchema.parse(payload);
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);
  const { data, error } = await supabase.from("alerts").insert(alertColumns(values)).select("id").single();
  if (error) throw new Error(error.message);
  await replaceAlertRelations({ supabase, alertId: data.id, values, actorId: user.id });
  await notifyCriticalAlert(supabase, data.id, values);
  await logActivity({ supabase, actorId: user.id, action: "alert_created", entityType: "alert", entityId: data.id });
  revalidateAlertPaths(data.id, values.client_ids);
  redirect(redirectTo || `/alerts/${data.id}?toast=alert_created`);
}

export async function updateAlertRecord(id: string, payload: AlertFormValues, redirectTo?: string) {
  const values = alertSchema.parse(payload);
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);
  const { error } = await supabase.from("alerts").update(alertColumns(values)).eq("id", id).is("deleted_at", null);
  if (error) throw new Error(error.message);
  await replaceAlertRelations({ supabase, alertId: id, values, actorId: user.id });
  await logActivity({ supabase, actorId: user.id, action: "alert_updated", entityType: "alert", entityId: id });
  revalidateAlertPaths(id, values.client_ids);
  redirect(redirectTo || `/alerts/${id}?toast=alert_updated`);
}

export async function archiveAlertRecord(id: string, clientIds: string[] = [], redirectTo?: string) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);
  const { error } = await supabase.from("alerts").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  await logActivity({ supabase, actorId: user.id, action: "alert_archived", entityType: "alert", entityId: id });
  revalidateAlertPaths(id, clientIds);
  redirect(redirectTo || "/alerts?toast=alert_archived");
}

export async function createAlertFollowupTask(alertId: string, payload: TaskFormValues) {
  const values = taskSchema.parse({ ...payload, origin_type: "alert", origin_id: alertId });
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);
  await logActivity({ supabase, actorId: user.id, action: "alert_task_created", entityType: "alert", entityId: alertId });
  await createTaskRecord(values, `/alerts/${alertId}?toast=alert_task_created`);
}

function revalidateAlertPaths(alertId: string, clientIds: string[]) {
  revalidatePath("/alerts");
  revalidatePath(`/alerts/${alertId}`);
  revalidatePath(`/alerts/${alertId}/edit`);
  revalidatePath("/dashboard");
  clientIds.forEach((clientId) => revalidatePath(`/clients/${clientId}`));
}
