import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ToastMessage } from "@/components/feedback/toast-message";
import { ConfirmAction } from "@/components/feedback/confirm-action";
import { archiveContactRecord } from "@/lib/actions/contacts";
import { createClient } from "@/lib/supabase/server";
import { firstRelation } from "@/lib/data/tasks";
import { TaskPriorityBadge, TaskStatusBadge, isOverdue } from "@/components/tasks/task-badges";
import { formatInteractionDate, InteractionTypeBadge } from "@/components/interactions/interaction-badges";
import { ReportStatusBadge, ReportTypeBadge } from "@/components/reports/report-badges";
import { AlertCategoryBadge, AlertUrgencyBadge } from "@/components/alerts/alert-badges";
import { InfluenceBadge, SensitivityBadge, StakeholderTypeBadge, StanceBadge } from "@/components/stakeholders/stakeholder-badges";
import { EntityDocuments } from "@/components/documents/entity-documents";
import { ClientHistoryTimeline } from "@/components/clients/client-history-timeline";
import { PrintReportButton } from "@/components/clients/print-report-button";
import { formatCalendarEventDate } from "@/components/calendar/calendar-event-card";
import { getClientHistory } from "@/lib/data/client-history";

type ClientDetail = {
  id: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  status: string;
  client_type: string;
  description: string | null;
  strategic_profile: string | null;
  start_date: string | null;
  end_date: string | null;
  confidentiality_level: string;
  website: string | null;
  drive_url: string | null;
  general_notes: string | null;
  updated_at: string;
  client_industries?: Array<{ industries: { id: string; name: string } | null }>;
  client_interests?: Array<{ priority: string; start_date: string | null; end_date: string | null; interests: { id: string; name: string } | null }>;
  client_assignments?: Array<{ role: string | null; profiles: { id: string; full_name: string | null; email: string | null } | null }>;
};

type ContactRow = {
  id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  title: string | null;
  email: string | null;
  whatsapp: string | null;
  linkedin_url: string | null;
  area: string | null;
  relationship_role: string | null;
  is_primary: boolean;
  is_active: boolean;
  birthday: string | null;
  notes: string | null;
};

type ClientTaskRow = {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "in_review" | "completed" | "cancelled";
  priority: string;
  due_date: string | null;
  updated_at: string;
  task_assignees?: Array<{ profiles: { full_name: string | null; email: string | null } | Array<{ full_name: string | null; email: string | null }> | null }>;
};

type ClientInteractionRow = {
  interaction_id: string;
  interactions: {
    id: string;
    title: string;
    type: string;
    interaction_date: string | null;
    start_time: string | null;
    end_time: string | null;
    summary: string | null;
    next_steps: string | null;
    interaction_internal_participants?: Array<{ profiles: { full_name: string | null; email: string | null } | Array<{ full_name: string | null; email: string | null }> | null }>;
  } | Array<{
    id: string;
    title: string;
    type: string;
    interaction_date: string | null;
    start_time: string | null;
    end_time: string | null;
    summary: string | null;
    next_steps: string | null;
    interaction_internal_participants?: Array<{ profiles: { full_name: string | null; email: string | null } | Array<{ full_name: string | null; email: string | null }> | null }>;
  }> | null;
};

type ClientReportRow = {
  report_id: string;
  reports: { id: string; title: string; type: string; status: string; topic: string | null; sent_at: string | null; responsible_id: string | null } | Array<{ id: string; title: string; type: string; status: string; topic: string | null; sent_at: string | null; responsible_id: string | null }> | null;
};

type ClientAlertRow = {
  alert_id: string;
  alerts: { id: string; title: string; category: string; urgency: string; medium: string; sent_at: string | null; responsible_id: string | null } | Array<{ id: string; title: string; category: string; urgency: string; medium: string; sent_at: string | null; responsible_id: string | null }> | null;
};

type ClientStakeholderRow = {
  relationship_description: string | null;
  stakeholders: {
    id: string;
    full_name: string;
    type: string;
    organization: string | null;
    title: string | null;
    jurisdiction: string | null;
    influence_level: string | null;
    stance: string | null;
    sensitivity_level: string | null;
  } | Array<{
    id: string;
    full_name: string;
    type: string;
    organization: string | null;
    title: string | null;
    jurisdiction: string | null;
    influence_level: string | null;
    stance: string | null;
    sensitivity_level: string | null;
  }> | null;
};

type ClientInternalCalendarEventRow = {
  id: string;
  title: string;
  event_type: string;
  status: string;
  location: string | null;
  start_at: string | null;
  end_at: string | null;
  meeting_url: string | null;
  task_id: string | null;
  interaction_id: string | null;
  interactions?: { id: string; title: string } | { id: string; title: string }[] | null;
  tasks?: { id: string; title: string } | { id: string; title: string }[] | null;
};

export default async function ClientDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ toast?: string }>;
}) {
  const [{ id }, query] = await Promise.all([
    params,
    searchParams
  ]);
  const supabase = await createClient();

  const [{ data: client }, { data: contacts }, { data: clientTasks }, { data: clientInteractions }, { data: clientReports }, { data: clientAlerts }, { data: clientStakeholders }, { data: clientInternalCalendarEvents }, { data: profilesForLabels }] = await Promise.all([
    supabase
      .from("clients")
      .select(`
        *,
        client_industries(industries(id, name)),
        client_interests(priority, start_date, end_date, interests(id, name)),
        client_assignments(role, profiles(id, full_name, email))
      `)
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("contacts")
      .select("*")
      .eq("client_id", id)
      .is("deleted_at", null)
      .order("is_primary", { ascending: false })
      .order("full_name"),
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, updated_at, task_assignees(profiles(full_name, email))")
      .eq("client_id", id)
      .is("deleted_at", null)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("interaction_clients")
      .select(`
        interaction_id,
        interactions(
          id,
          title,
          type,
          interaction_date,
          start_time,
          end_time,
          summary,
          next_steps,
          interaction_internal_participants(profiles(full_name, email))
        )
      `)
      .eq("client_id", id)
      .is("interactions.deleted_at", null),
    supabase
      .from("report_clients")
      .select("report_id, reports(id, title, type, status, topic, sent_at, responsible_id)")
      .eq("client_id", id)
      .is("reports.deleted_at", null),
    supabase
      .from("alert_clients")
      .select("alert_id, alerts(id, title, category, urgency, medium, sent_at, responsible_id)")
      .eq("client_id", id)
      .is("alerts.deleted_at", null),
    supabase
      .from("stakeholder_clients")
      .select("relationship_description, stakeholders(id, full_name, type, organization, title, jurisdiction, influence_level, stance, sensitivity_level)")
      .eq("client_id", id)
      .is("stakeholders.deleted_at", null),
    supabase
      .from("internal_calendar_events")
      .select("id, title, event_type, status, location, start_at, end_at, meeting_url, task_id, interaction_id, interactions(id, title), tasks(id, title)")
      .eq("client_id", id)
      .is("deleted_at", null)
      .order("start_at", { ascending: false, nullsFirst: false })
      .limit(8),
    supabase.from("profiles").select("id, full_name, email")
  ]);

  if (!client) notFound();

  const detail = client as ClientDetail;
  const history = await getClientHistory(detail.id, detail.name);
  const profileLabels = new Map(((profilesForLabels || []) as Array<{ id: string; full_name: string | null; email: string | null }>).map((profile) => [profile.id, profile.full_name || profile.email || "Usuario"]));
  const taskRows = (clientTasks || []) as unknown as ClientTaskRow[];
  return (
    <>
      <ToastMessage code={query.toast} />
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/clients"><ArrowLeft className="h-4 w-4" /> Volver al listado</Link>
        </Button>
      </div>
      <PageHeader
        title={detail.name}
        description={detail.legal_name || "Ficha operativa de cliente"}
        actions={<><PrintReportButton /><Button asChild><Link href={`/clients/${detail.id}/edit`}>Editar cliente</Link></Button></>}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {["Tareas", "Calls", "Historial", "Contactos", "Calendario", "Reportes", "Alertas", "Documentos", "Stakeholders"].map((tab) => (
          <Badge key={tab} variant={tab === "Tareas" ? "secondary" : "outline"}>{tab}</Badge>
        ))}
      </div>

      <div className="grid gap-6">
        <div className="space-y-6">
          <ClientTasksSection clientId={detail.id} tasks={taskRows} />
          <ClientInteractionsSection clientId={detail.id} interactions={(clientInteractions || []) as unknown as ClientInteractionRow[]} />
          <WorkedOnSection events={history} />
          <ClientHistoryTimeline events={history} />

          <Card>
            <CardHeader>
              <CardTitle>Contactos</CardTitle>
              <CardDescription>Contactos activos e inactivos asociados a este cliente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(contacts as ContactRow[] | null)?.length ? (
                <div className="grid gap-3">
                  {(contacts as ContactRow[]).map((contact) => (
                    <div key={contact.id} className={`rounded-md border p-4 ${contact.is_active ? "bg-card" : "bg-muted/40 opacity-75"}`}>
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium">{contact.full_name}</h3>
                            {contact.is_primary ? <Badge variant="success">principal</Badge> : null}
                            {!contact.is_active ? <Badge variant="muted">inactivo</Badge> : null}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{[contact.title, contact.area, contact.relationship_role].filter(Boolean).join(" / ") || "Sin cargo"}</p>
                          <p className="mt-2 text-sm">{contact.email || "-"} {contact.whatsapp ? `- ${contact.whatsapp}` : ""}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm"><Link href={`/contacts/${contact.id}/edit`}>Editar</Link></Button>
                          <ConfirmAction
                            label="Archivar"
                            confirmMessage={`Archivar ${contact.full_name}?`}
                            action={archiveContactRecord.bind(null, contact.id, detail.id)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-md border p-4 text-sm text-muted-foreground">Este cliente todavia no tiene contactos.</p>
              )}
            </CardContent>
          </Card>

          <ClientInternalCalendarEventsSection clientId={detail.id} events={(clientInternalCalendarEvents || []) as unknown as ClientInternalCalendarEventRow[]} tasks={taskRows} />
          <ClientReportsSection clientId={detail.id} reports={(clientReports || []) as unknown as ClientReportRow[]} profileLabels={profileLabels} />
          <ClientAlertsSection clientId={detail.id} alerts={(clientAlerts || []) as unknown as ClientAlertRow[]} profileLabels={profileLabels} />
          <ClientStakeholdersSection clientId={detail.id} stakeholders={(clientStakeholders || []) as unknown as ClientStakeholderRow[]} />
          <EntityDocuments entityType="client" entityId={detail.id} />
        </div>

      </div>
    </>
  );
}

function WorkedOnSection({ events }: { events: import("@/lib/data/client-history").ClientTimelineEvent[] }) {
  const relevant = events
    .filter((event) => ["interaction", "report", "alert", "task", "document"].includes(event.type))
    .filter((event) => event.type !== "task" || event.status === "completed")
    .slice(0, 12);
  return (
    <Card className="print:shadow-none">
      <CardHeader>
        <CardTitle>Que se trabajo con este cliente</CardTitle>
        <CardDescription>Ultimos hitos concretos: interacciones, envios, tareas cerradas y documentos.</CardDescription>
      </CardHeader>
      <CardContent>
        {relevant.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {relevant.map((event) => (
              <Link key={event.id} href={event.href || "#"} className="rounded-md border p-3 text-sm hover:bg-accent">
                <div className="mb-2 flex flex-wrap gap-1">
                  <Badge variant="muted">{event.type}</Badge>
                  {event.status ? <Badge variant="secondary">{event.status}</Badge> : null}
                  {event.priority ? <Badge variant={["urgent", "critical", "high"].includes(event.priority) ? "warning" : "muted"}>{event.priority}</Badge> : null}
                </div>
                <p className="font-medium">{event.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(event.date)}</p>
                {event.description ? <p className="mt-2 line-clamp-2 text-muted-foreground">{event.description}</p> : null}
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-md border p-4 text-sm text-muted-foreground">Todavia no hay hitos suficientes para este cliente.</p>
        )}
      </CardContent>
    </Card>
  );
}

function ClientTasksSection({ clientId, tasks }: { clientId: string; tasks: ClientTaskRow[] }) {
  const openTasks = tasks.filter((task) => !["completed", "cancelled"].includes(task.status));
  const completedTasks = tasks.filter((task) => task.status === "completed").slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>Tareas</CardTitle>
          <CardDescription>Tareas abiertas y completadas recientes asociadas al cliente.</CardDescription>
        </div>
        <Button asChild><Link href={`/tasks/new?clientId=${clientId}`}>Nueva tarea</Link></Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <TaskGroup title="Abiertas" tasks={openTasks} />
        <TaskGroup title="Completadas recientes" tasks={completedTasks} />
      </CardContent>
    </Card>
  );
}

function TaskGroup({ title, tasks }: { title: string; tasks: ClientTaskRow[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{title}</h3>
      {tasks.length ? (
        <div className="grid gap-3">
          {tasks.map((task) => {
            const assignees = (task.task_assignees || []).flatMap((item) => {
              const profile = firstRelation(item.profiles);
              return profile ? [profile.full_name || profile.email || "Usuario"] : [];
            });
            return (
              <Link key={task.id} href={`/tasks/${task.id}`} className={`rounded-md border p-3 text-sm hover:bg-accent ${isOverdue(task.due_date, task.status) ? "border-destructive/50" : ""}`}>
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{assignees.length ? assignees.join(", ") : "Sin responsable"}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <TaskStatusBadge status={task.status} />
                    <TaskPriorityBadge priority={task.priority} />
                    {task.due_date ? <Badge variant={isOverdue(task.due_date, task.status) ? "warning" : "muted"}>{task.due_date}</Badge> : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="rounded-md border p-3 text-sm text-muted-foreground">Sin tareas en esta seccion.</p>
      )}
    </div>
  );
}

function ClientInteractionsSection({ clientId, interactions }: { clientId: string; interactions: ClientInteractionRow[] }) {
  const rows = interactions
    .flatMap((row) => {
      const interaction = firstRelation(row.interactions);
      return interaction ? [interaction] : [];
    })
    .sort((a, b) => (b.interaction_date || "").localeCompare(a.interaction_date || ""))
    .slice(0, 8);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>Calls / Interacciones</CardTitle>
          <CardDescription>Ultimas interacciones asociadas al cliente.</CardDescription>
        </div>
        <Button asChild><Link href={`/interactions/new?clientId=${clientId}`}>Nueva interaccion</Link></Button>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <div className="grid gap-3">
            {rows.map((interaction) => {
              const participants = (interaction.interaction_internal_participants || []).flatMap((item) => {
                const profile = firstRelation(item.profiles);
                return profile ? [profile.full_name || profile.email || "Usuario"] : [];
              });
              return (
                <Link key={interaction.id} href={`/interactions/${interaction.id}`} className="rounded-md border p-3 text-sm hover:bg-accent">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-medium">{interaction.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatInteractionDate(interaction.interaction_date, interaction.start_time, interaction.end_time)}</p>
                      <p className="mt-2 line-clamp-2 text-muted-foreground">{interaction.summary || interaction.next_steps || "Sin resumen cargado"}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <InteractionTypeBadge type={interaction.type} />
                      {participants.slice(0, 2).map((participant) => <Badge key={participant} variant="muted">{participant}</Badge>)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="rounded-md border p-4 text-sm text-muted-foreground">Sin interacciones para este cliente.</p>
        )}
      </CardContent>
    </Card>
  );
}

function ClientInternalCalendarEventsSection({ clientId, events, tasks }: { clientId: string; events: ClientInternalCalendarEventRow[]; tasks: ClientTaskRow[] }) {
  const upcoming = events.filter((event) => new Date(event.start_at || "").getTime() >= Date.now()).slice(0, 6);
  const recent = events.filter((event) => new Date(event.start_at || "").getTime() < Date.now()).slice(0, 6);
  const pendingInteraction = events.filter((event) => !event.interaction_id && !["completed", "cancelled"].includes(event.status)).slice(0, 6);
  const taskDeadlines = tasks
    .filter((task) => task.due_date && !["completed", "cancelled"].includes(task.status))
    .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""))
    .slice(0, 6);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>Calendario</CardTitle>
          <CardDescription>Proximas reuniones, eventos recientes y pendientes de interaccion.</CardDescription>
        </div>
        <Button asChild><Link href={`/internal-calendar/new?clientId=${clientId}`}>Nuevo evento</Link></Button>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-4">
        <ClientEventGroup title="Proximos" events={upcoming} empty="Sin proximos eventos." />
        <ClientEventGroup title="Recientes" events={recent} empty="Sin eventos recientes." />
        <ClientEventGroup title="Sin interacción creada" events={pendingInteraction} empty="Sin eventos pendientes." />
        <ClientTaskDeadlineGroup tasks={taskDeadlines} />
      </CardContent>
    </Card>
  );
}

function ClientEventGroup({ title, events, empty }: { title: string; events: ClientInternalCalendarEventRow[]; empty: string }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {events.length ? events.map((event) => {
        const interaction = firstRelation(event.interactions);
        const task = firstRelation(event.tasks);
        return (
          <Link key={event.id} href={`/internal-calendar/${event.id}`} className="block rounded-md border p-3 text-sm hover:bg-accent">
            <p className="font-medium">{event.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatCalendarEventDate({ start_at: event.start_at, end_at: event.end_at, start_date: null, end_date: null })}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant="muted">{event.event_type}</Badge>
              <Badge variant={event.status === "completed" ? "success" : event.status === "cancelled" ? "danger" : "secondary"}>{event.status}</Badge>
              {interaction ? <Badge variant="success">con interaccion</Badge> : null}
              {task ? <Badge variant="warning">tarea</Badge> : null}
            </div>
          </Link>
        );
      }) : <p className="rounded-md border p-3 text-sm text-muted-foreground">{empty}</p>}
    </div>
  );
}

function ClientTaskDeadlineGroup({ tasks }: { tasks: ClientTaskRow[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Tareas con vencimiento</h3>
      {tasks.length ? tasks.map((task) => (
        <Link key={task.id} href={`/tasks/${task.id}`} className="block rounded-md border p-3 text-sm hover:bg-accent">
          <p className="font-medium">{task.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{task.due_date} - Tarea con vencimiento</p>
          <div className="mt-2 flex flex-wrap gap-1">
            <TaskStatusBadge status={task.status} />
            <TaskPriorityBadge priority={task.priority} />
          </div>
        </Link>
      )) : <p className="rounded-md border p-3 text-sm text-muted-foreground">Sin tareas próximas a vencer.</p>}
    </div>
  );
}

function ClientReportsSection({ clientId, reports, profileLabels }: { clientId: string; reports: ClientReportRow[]; profileLabels: Map<string, string> }) {
  const rows = reports.flatMap((row) => {
    const report = firstRelation(row.reports);
    return report ? [report] : [];
  }).sort((a, b) => (b.sent_at || "").localeCompare(a.sent_at || "")).slice(0, 8);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div><CardTitle>Reportes</CardTitle><CardDescription>Ultimos reportes asociados al cliente.</CardDescription></div>
        <Button asChild><Link href={`/reports/new?clientId=${clientId}`}>Nuevo reporte</Link></Button>
      </CardHeader>
      <CardContent>
        {rows.length ? <div className="grid gap-3">{rows.map((report) => (
          <Link key={report.id} href={`/reports/${report.id}`} className="rounded-md border p-3 text-sm hover:bg-accent">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div><p className="font-medium">{report.title}</p><p className="mt-1 text-xs text-muted-foreground">{report.topic || "Sin tema"} - {report.sent_at || "Sin envio"} - {report.responsible_id ? profileLabels.get(report.responsible_id) || "Responsable" : "Sin responsable"}</p></div>
              <div className="flex flex-wrap gap-1"><ReportTypeBadge type={report.type} /><ReportStatusBadge status={report.status} /></div>
            </div>
          </Link>
        ))}</div> : <p className="rounded-md border p-4 text-sm text-muted-foreground">Sin reportes para este cliente.</p>}
      </CardContent>
    </Card>
  );
}

function ClientAlertsSection({ clientId, alerts, profileLabels }: { clientId: string; alerts: ClientAlertRow[]; profileLabels: Map<string, string> }) {
  const rows = alerts.flatMap((row) => {
    const alert = firstRelation(row.alerts);
    return alert ? [alert] : [];
  }).sort((a, b) => (b.sent_at || "").localeCompare(a.sent_at || "")).slice(0, 8);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div><CardTitle>Alertas</CardTitle><CardDescription>Ultimas alertas asociadas al cliente.</CardDescription></div>
        <Button asChild><Link href={`/alerts/new?clientId=${clientId}`}>Nueva alerta</Link></Button>
      </CardHeader>
      <CardContent>
        {rows.length ? <div className="grid gap-3">{rows.map((alert) => (
          <Link key={alert.id} href={`/alerts/${alert.id}`} className="rounded-md border p-3 text-sm hover:bg-accent">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div><p className="font-medium">{alert.title}</p><p className="mt-1 text-xs text-muted-foreground">{alert.medium} - {alert.sent_at || "Sin envio"} - {alert.responsible_id ? profileLabels.get(alert.responsible_id) || "Responsable" : "Sin responsable"}</p></div>
              <div className="flex flex-wrap gap-1"><AlertCategoryBadge category={alert.category} /><AlertUrgencyBadge urgency={alert.urgency} /></div>
            </div>
          </Link>
        ))}</div> : <p className="rounded-md border p-4 text-sm text-muted-foreground">Sin alertas para este cliente.</p>}
      </CardContent>
    </Card>
  );
}

function ClientStakeholdersSection({ clientId, stakeholders }: { clientId: string; stakeholders: ClientStakeholderRow[] }) {
  const rows = stakeholders.flatMap((row) => {
    const stakeholder = firstRelation(row.stakeholders);
    return stakeholder ? [{ ...stakeholder, relationship_description: row.relationship_description }] : [];
  });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>Stakeholders</CardTitle>
          <CardDescription>Actores relacionados con este cliente.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href="/stakeholders">Vincular existente</Link></Button>
          <Button asChild><Link href={`/stakeholders/new?clientId=${clientId}`}>Nuevo stakeholder</Link></Button>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <div className="grid gap-3">
            {rows.map((stakeholder) => (
              <Link key={stakeholder.id} href={`/stakeholders/${stakeholder.id}`} className="rounded-md border p-3 text-sm hover:bg-accent">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium">{stakeholder.full_name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[stakeholder.organization, stakeholder.title, stakeholder.jurisdiction].filter(Boolean).join(" / ") || "Sin datos institucionales"}
                    </p>
                    <p className="mt-2 line-clamp-2 text-muted-foreground">{stakeholder.relationship_description || "Sin descripcion de relacion"}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <StakeholderTypeBadge type={stakeholder.type} />
                    <InfluenceBadge level={stakeholder.influence_level} />
                    <StanceBadge stance={stakeholder.stance || "unknown"} />
                    <SensitivityBadge level={stakeholder.sensitivity_level} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-md border p-4 text-sm text-muted-foreground">Sin stakeholders relacionados a este cliente.</p>
        )}
      </CardContent>
    </Card>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
