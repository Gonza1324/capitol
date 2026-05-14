"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { reportSchema, type ReportFormValues } from "@/lib/validators/report";
import { taskSchema, type TaskFormValues } from "@/lib/validators/task";
import { assertInternalRole, getCurrentProfile, logActivity } from "./helpers";
import { createTaskRecord } from "./tasks";

function reportColumns(values: ReportFormValues) {
  return {
    title: values.title,
    type: values.type,
    status: values.status,
    topic: values.topic,
    description: values.description,
    sent_at: values.sent_at,
    responsible_id: values.responsible_id,
    external_url: values.external_url,
    notes: values.notes,
    approval_required: values.approval_required,
    approved_by: values.approved_by,
    approved_at: values.approved_at,
    is_client_visible: false
  };
}

async function replaceReportRelations({
  supabase,
  reportId,
  values,
  actorId
}: {
  supabase: Awaited<ReturnType<typeof getCurrentProfile>>["supabase"];
  reportId: string;
  values: ReportFormValues;
  actorId: string;
}) {
  const deletes = await Promise.all([
    supabase.from("report_clients").delete().eq("report_id", reportId),
    supabase.from("report_recipients").delete().eq("report_id", reportId)
  ]);
  const deleteError = deletes.find((result) => result.error)?.error;
  if (deleteError) throw new Error(deleteError.message);

  const inserts = [];
  if (values.client_ids.length) {
    inserts.push(supabase.from("report_clients").insert(values.client_ids.map((clientId) => ({ report_id: reportId, client_id: clientId }))));
  }
  if (values.recipients.length) {
    inserts.push(supabase.from("report_recipients").insert(values.recipients.map((recipient) => ({ report_id: reportId, contact_id: recipient.contact_id, name: recipient.name, email: recipient.email }))));
  }
  if (inserts.length) {
    const results = await Promise.all(inserts);
    const insertError = results.find((result) => result.error)?.error;
    if (insertError) throw new Error(insertError.message);
  }

  await logActivity({ supabase, actorId, action: "report_clients_updated", entityType: "report", entityId: reportId, metadata: { client_ids: values.client_ids } });
  await logActivity({ supabase, actorId, action: "report_recipients_updated", entityType: "report", entityId: reportId, metadata: { count: values.recipients.length } });
}

async function notifyReportIfNeeded(supabase: Awaited<ReturnType<typeof getCurrentProfile>>["supabase"], reportId: string, values: ReportFormValues) {
  if (!values.approval_required) return;
  const { data: profiles } = await supabase.from("profiles").select("id").in("role", ["admin", "partner_director"]);
  const ids = ((profiles || []) as Array<{ id: string }>).map((profile) => profile.id);
  if (!ids.length) return;
  await supabase.from("notifications").insert(ids.map((userId) => ({
    user_id: userId,
    type: "report_pending_approval",
    title: "Reporte pendiente de aprobacion",
    body: values.title,
    entity_type: "report",
    entity_id: reportId
  })));
}

export async function createReportRecord(payload: ReportFormValues, redirectTo?: string) {
  const values = reportSchema.parse(payload);
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);
  const { data, error } = await supabase.from("reports").insert(reportColumns(values)).select("id").single();
  if (error) throw new Error(error.message);

  await replaceReportRelations({ supabase, reportId: data.id, values, actorId: user.id });
  await notifyReportIfNeeded(supabase, data.id, values);
  await logActivity({ supabase, actorId: user.id, action: "report_created", entityType: "report", entityId: data.id });
  revalidateReportPaths(data.id, values.client_ids);
  redirect(redirectTo || `/reports/${data.id}?toast=report_created`);
}

export async function updateReportRecord(id: string, payload: ReportFormValues, redirectTo?: string) {
  const values = reportSchema.parse(payload);
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);
  const { error } = await supabase.from("reports").update(reportColumns(values)).eq("id", id).is("deleted_at", null);
  if (error) throw new Error(error.message);

  await replaceReportRelations({ supabase, reportId: id, values, actorId: user.id });
  await logActivity({ supabase, actorId: user.id, action: "report_updated", entityType: "report", entityId: id });
  revalidateReportPaths(id, values.client_ids);
  redirect(redirectTo || `/reports/${id}?toast=report_updated`);
}

export async function changeReportStatus(id: string, status: "sent" | "approved", clientIds: string[] = [], redirectTo?: string) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);
  const patch = status === "sent"
    ? { status: "sent", sent_at: new Date().toISOString() }
    : { status: "approved", approved_by: user.id, approved_at: new Date().toISOString() };
  const { error } = await supabase.from("reports").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  await logActivity({ supabase, actorId: user.id, action: status === "sent" ? "report_sent" : "report_approved", entityType: "report", entityId: id });
  revalidateReportPaths(id, clientIds);
  redirect(redirectTo || `/reports/${id}?toast=${status === "sent" ? "report_sent" : "report_approved"}`);
}

export async function archiveReportRecord(id: string, clientIds: string[] = [], redirectTo?: string) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);
  const { error } = await supabase.from("reports").update({ deleted_at: new Date().toISOString(), status: "archived" }).eq("id", id);
  if (error) throw new Error(error.message);
  await logActivity({ supabase, actorId: user.id, action: "report_archived", entityType: "report", entityId: id });
  revalidateReportPaths(id, clientIds);
  redirect(redirectTo || "/reports?toast=report_archived");
}

export async function createReportFollowupTask(reportId: string, payload: TaskFormValues) {
  const values = taskSchema.parse({ ...payload, origin_type: "report", origin_id: reportId });
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);
  await logActivity({ supabase, actorId: user.id, action: "report_task_created", entityType: "report", entityId: reportId });
  await createTaskRecord(values, `/reports/${reportId}?toast=report_task_created`);
}

function revalidateReportPaths(reportId: string, clientIds: string[]) {
  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);
  revalidatePath(`/reports/${reportId}/edit`);
  revalidatePath("/dashboard");
  clientIds.forEach((clientId) => revalidatePath(`/clients/${clientId}`));
}
