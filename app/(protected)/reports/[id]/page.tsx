import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ToastMessage } from "@/components/feedback/toast-message";
import { ConfirmAction } from "@/components/feedback/confirm-action";
import { TaskForm } from "@/components/forms/task-form";
import { ReportStatusBadge, ReportTypeBadge } from "@/components/reports/report-badges";
import { archiveReportRecord, changeReportStatus, createReportFollowupTask } from "@/lib/actions/reports";
import { createClient } from "@/lib/supabase/server";
import { firstRelation, getTaskFormOptions } from "@/lib/data/tasks";
import { EntityDocuments } from "@/components/documents/entity-documents";

export default async function ReportDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ toast?: string }> }) {
  const [{ id }, query, taskOptions] = await Promise.all([params, searchParams, getTaskFormOptions()]);
  const supabase = await createClient();
  const [{ data: report }, { data: clients }, { data: recipients }, { data: tasks }, { data: activity }, { data: profiles }] = await Promise.all([
    supabase.from("reports").select("*").eq("id", id).is("deleted_at", null).maybeSingle(),
    supabase.from("report_clients").select("clients(id, name)").eq("report_id", id),
    supabase.from("report_recipients").select("name, email, contacts(full_name, email)").eq("report_id", id),
    supabase.from("tasks").select("id, title, status, priority").eq("origin_type", "report").eq("origin_id", id).is("deleted_at", null),
    supabase.from("activity_log").select("action, created_at").eq("entity_type", "report").eq("entity_id", id).order("created_at", { ascending: false }).limit(10),
    supabase.from("profiles").select("id, full_name, email")
  ]);
  if (!report) notFound();
  const profileLabels = new Map(((profiles || []) as Array<{ id: string; full_name: string | null; email: string | null }>).map((p) => [p.id, p.full_name || p.email || "Usuario"]));
  const linkedClients = ((clients || []) as Array<{ clients: { id: string; name: string } | { id: string; name: string }[] | null }>).flatMap((r) => { const c = firstRelation(r.clients); return c ? [c] : []; });
  const recipientLabels = ((recipients || []) as Array<{ name: string | null; email: string | null; contacts: { full_name: string; email: string | null } | { full_name: string; email: string | null }[] | null }>).map((r) => { const c = firstRelation(r.contacts); return c?.full_name || r.name || r.email || "Destinatario"; });
  const firstClientId = linkedClients[0]?.id || "";
  return <><ToastMessage code={query.toast} /><PageHeader title={report.title} description={report.topic || "Reporte enviado"} actions={<Button asChild><Link href={`/reports/${id}/edit`}>Editar</Link></Button>} /><div className="grid gap-6 xl:grid-cols-[1fr_24rem]"><div className="space-y-6"><Card><CardHeader><CardTitle>Detalle</CardTitle></CardHeader><CardContent className="grid gap-5 md:grid-cols-2"><Info label="Tipo"><ReportTypeBadge type={report.type} /></Info><Info label="Estado"><ReportStatusBadge status={report.status} /></Info><Info label="Clientes"><LinkBadges values={linkedClients.map((c) => ({ href: `/clients/${c.id}`, label: c.name }))} /></Info><Info label="Responsable">{report.responsible_id ? profileLabels.get(report.responsible_id) || "-" : "-"}</Info><Info label="Envio">{formatDate(report.sent_at)}</Info><Info label="Aprobacion">{report.approval_required ? (report.approved_at ? "Aprobado" : "Pendiente") : "No requerida"}</Info><Info label="Documento">{report.external_url ? <a className="text-primary underline" href={report.external_url} target="_blank">Abrir documento</a> : "-"}</Info><Info label="Destinatarios"><BadgeGroup values={recipientLabels} /></Info><Info label="Descripcion" wide>{report.description || "-"}</Info><Info label="Notas" wide>{report.notes || "-"}</Info></CardContent></Card><Card><CardHeader><CardTitle>Tarea de seguimiento</CardTitle></CardHeader><CardContent className="space-y-4"><TaskForm action={createReportFollowupTask.bind(null, id)} clients={taskOptions.clients} profiles={taskOptions.profiles} lockedClientId={firstClientId || undefined} task={{ title: `Seguimiento reporte: ${report.title}`, description: [report.topic, report.notes].filter(Boolean).join("\n"), client_id: firstClientId, priority: "medium", status: "pending", origin_type: "report", origin_id: id }} />{((tasks || []) as Array<{ id: string; title: string }>).map((task) => <Link key={task.id} className="block rounded-md border p-3 text-sm hover:bg-accent" href={`/tasks/${task.id}`}>{task.title}</Link>)}</CardContent></Card><EntityDocuments entityType="report" entityId={id} /></div><aside className="space-y-6"><Card><CardHeader><CardTitle>Acciones</CardTitle></CardHeader><CardContent className="space-y-2"><form action={changeReportStatus.bind(null, id, "sent", linkedClients.map((c) => c.id), `/reports/${id}?toast=report_sent`)}><Button className="w-full">Marcar enviado</Button></form><form action={changeReportStatus.bind(null, id, "approved", linkedClients.map((c) => c.id), `/reports/${id}?toast=report_approved`)}><Button className="w-full" variant="outline">Marcar aprobado</Button></form><ConfirmAction label="Archivar" variant="destructive" confirmMessage={`Archivar ${report.title}?`} action={archiveReportRecord.bind(null, id, linkedClients.map((c) => c.id), "/reports?toast=report_archived")} /></CardContent></Card><Activity items={(activity || []) as Array<{ action: string; created_at: string }>} /></aside></div></>;
}

function Info({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) { return <div className={wide ? "md:col-span-2" : ""}><p className="mb-1 text-xs font-medium uppercase text-muted-foreground">{label}</p><div className="text-sm whitespace-pre-wrap">{children}</div></div>; }
function BadgeGroup({ values }: { values: string[] }) { return values.length ? <div className="flex flex-wrap gap-1">{values.map((v) => <Badge key={v} variant="muted">{v}</Badge>)}</div> : <span className="text-muted-foreground">-</span>; }
function LinkBadges({ values }: { values: Array<{ href: string; label: string }> }) { return values.length ? <div className="flex flex-wrap gap-1">{values.map((v) => <Badge key={v.href} variant="muted"><Link href={v.href}>{v.label}</Link></Badge>)}</div> : <span className="text-muted-foreground">-</span>; }
function Activity({ items }: { items: Array<{ action: string; created_at: string }> }) { return <Card><CardHeader><CardTitle>Actividad</CardTitle></CardHeader><CardContent className="space-y-2">{items.length ? items.map((i) => <div key={`${i.action}-${i.created_at}`} className="rounded-md border px-3 py-2 text-sm"><p className="font-medium">{i.action}</p><p className="text-xs text-muted-foreground">{formatDate(i.created_at)}</p></div>) : <p className="text-sm text-muted-foreground">Sin actividad.</p>}</CardContent></Card>; }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "-"; }
