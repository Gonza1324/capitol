import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { InteractionTypeChart } from "@/components/interactions/interaction-type-chart";
import { TaskStatusChart } from "@/components/tasks/task-status-chart";
import { createClient } from "@/lib/supabase/server";
import { firstRelation } from "@/lib/data/tasks";

type TaskWithClient = {
  id: string;
  title: string;
  due_date: string | null;
  priority: string;
  status: string;
  clients: { id: string; name: string } | Array<{ id: string; name: string }> | null;
};

type ActivityRow = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | Array<{ full_name: string | null; email: string | null }> | null;
};

type ClientAttention = {
  id: string;
  name: string;
  reasons: string[];
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const weekStartDate = new Date(now);
  weekStartDate.setDate(now.getDate() - now.getDay());
  const weekStart = weekStartDate.toISOString().slice(0, 10);
  const staleCutoff = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const [
    { count: activeClients },
    { count: pendingTasks },
    { count: overdueTasks },
    { count: interactionsThisWeek },
    { count: reportsThisMonth },
    { data: criticalAlerts },
    { count: activeStakeholders },
    { count: documentsThisMonth },
    { data: myTaskRows },
    { data: overdueTaskRows },
    { data: upcomingTaskRows },
    { data: urgentTaskRows },
    { data: tasksByStatusRows },
    { data: alertsByUrgencyRows },
    { data: reportsByTypeRows },
    { data: interactionsByTypeRows },
    { data: recentActivityRows },
    { data: overdueClientRows },
    { data: activeClientRows },
    { data: recentClientInteractionRows },
    { data: criticalAlertClientRows },
    { data: reviewReportClientRows }
  ] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "active").is("deleted_at", null),
    supabase.from("tasks").select("id", { count: "exact", head: true }).in("status", ["pending", "in_progress", "in_review"]).is("deleted_at", null),
    supabase.from("tasks").select("id", { count: "exact", head: true }).lt("due_date", today).not("status", "in", "(completed,cancelled)").is("deleted_at", null),
    supabase.from("interactions").select("id", { count: "exact", head: true }).gte("interaction_date", weekStart).is("deleted_at", null),
    supabase.from("reports").select("id", { count: "exact", head: true }).gte("sent_at", monthStart).eq("status", "sent").is("deleted_at", null),
    supabase.from("alerts").select("id, title, sent_at").eq("urgency", "critical").is("deleted_at", null).order("sent_at", { ascending: false }).limit(5),
    supabase.from("stakeholders").select("id", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null),
    supabase.from("files").select("id", { count: "exact", head: true }).gte("created_at", monthStart).is("deleted_at", null),
    supabase.from("task_assignees").select("tasks(id, title, due_date, priority, status, clients(id, name))").eq("user_id", user?.id || "").not("tasks.status", "in", "(completed,cancelled)").is("tasks.deleted_at", null).limit(8),
    supabase.from("tasks").select("id, title, due_date, priority, status, clients(id, name)").lt("due_date", today).not("status", "in", "(completed,cancelled)").is("deleted_at", null).order("due_date").limit(8),
    supabase.from("tasks").select("id, title, due_date, priority, status, clients(id, name)").gte("due_date", today).not("status", "in", "(completed,cancelled)").is("deleted_at", null).order("due_date").limit(8),
    supabase.from("tasks").select("id, title, due_date, priority, status, clients(id, name)").eq("priority", "urgent").not("status", "in", "(completed,cancelled)").is("deleted_at", null).order("due_date", { ascending: true, nullsFirst: false }).limit(8),
    supabase.from("tasks").select("status").is("deleted_at", null),
    supabase.from("alerts").select("urgency").is("deleted_at", null),
    supabase.from("reports").select("type").is("deleted_at", null),
    supabase.from("interactions").select("type").is("deleted_at", null),
    supabase.from("activity_log").select("id, action, entity_type, entity_id, created_at, profiles:actor_id(full_name, email)").order("created_at", { ascending: false }).limit(18),
    supabase.from("tasks").select("client_id, clients(id, name)").lt("due_date", today).not("status", "in", "(completed,cancelled)").is("deleted_at", null).not("client_id", "is", null).limit(100),
    supabase.from("clients").select("id, name").eq("status", "active").is("deleted_at", null).limit(100),
    supabase.from("interaction_clients").select("client_id, interactions!inner(interaction_date)").gte("interactions.interaction_date", staleCutoff).is("interactions.deleted_at", null).limit(500),
    supabase.from("alert_clients").select("clients(id, name), alerts!inner(title, urgency, sent_at)").eq("alerts.urgency", "critical").gte("alerts.sent_at", monthStart).is("alerts.deleted_at", null).limit(100),
    supabase.from("report_clients").select("clients(id, name), reports!inner(status, title)").in("reports.status", ["draft", "in_review"]).is("reports.deleted_at", null).limit(100)
  ]);

  const myTasks = ((myTaskRows || []) as Array<{ tasks: TaskWithClient | TaskWithClient[] | null }>).flatMap((row) => {
    const task = firstRelation(row.tasks);
    return task ? [task] : [];
  });
  const overdueList = (overdueTaskRows || []) as unknown as TaskWithClient[];
  const upcomingTasks = (upcomingTaskRows || []) as unknown as TaskWithClient[];
  const urgentTasks = (urgentTaskRows || []) as unknown as TaskWithClient[];
  const activity = (recentActivityRows || []) as unknown as ActivityRow[];
  const attention = buildAttentionClients({
    overdueClientRows: overdueClientRows || [],
    activeClientRows: activeClientRows || [],
    recentClientInteractionRows: recentClientInteractionRows || [],
    criticalAlertClientRows: criticalAlertClientRows || [],
    reviewReportClientRows: reviewReportClientRows || []
  }).slice(0, 8);

  const metrics = [
    { label: "Clientes activos", value: activeClients || 0 },
    { label: "Tareas pendientes", value: pendingTasks || 0 },
    { label: "Tareas vencidas", value: overdueTasks || 0, warning: Boolean(overdueTasks) },
    { label: "Interacciones semana", value: interactionsThisWeek || 0 },
    { label: "Reportes enviados mes", value: reportsThisMonth || 0 },
    { label: "Alertas criticas", value: criticalAlerts?.length || 0, warning: Boolean(criticalAlerts?.length) },
    { label: "Stakeholders activos", value: activeStakeholders || 0 },
    { label: "Documentos mes", value: documentsThisMonth || 0 }
  ];
  const taskChartData = groupCount((tasksByStatusRows || []) as Array<{ status: string }>, "status").map(([status, count]) => ({ status, count }));
  const alertChartData = groupCount((alertsByUrgencyRows || []) as Array<{ urgency: string }>, "urgency").map(([type, count]) => ({ type, count }));
  const reportChartData = groupCount((reportsByTypeRows || []) as Array<{ type: string }>, "type").map(([type, count]) => ({ type, count }));
  const interactionChartData = groupCount((interactionsByTypeRows || []) as Array<{ type: string }>, "type").map(([type, count]) => ({ type, count }));

  return (
    <>
      <PageHeader title="Dashboard" description="Vista ejecutiva y operativa para seguimiento interno." />
      <section className="grid gap-4 md:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent><p className={metric.warning ? "text-2xl font-semibold text-destructive" : "text-2xl font-semibold"}>{metric.value}</p></CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-4">
        <TaskListCard title="Mis tareas pendientes" tasks={myTasks} />
        <TaskListCard title="Tareas vencidas" tasks={overdueList} danger />
        <TaskListCard title="Proximos vencimientos" tasks={upcomingTasks} />
        <TaskListCard title="Tareas urgentes" tasks={urgentTasks} danger />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1fr_24rem]">
        <Card>
          <CardHeader>
            <CardTitle>Clientes que requieren atencion</CardTitle>
            <CardDescription>Señales combinadas: vencimientos, poca interacción, alertas críticas y reportes en revisión.</CardDescription>
          </CardHeader>
          <CardContent>
            {attention.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {attention.map((client) => (
                  <Link key={client.id} href={`/clients/${client.id}`} className="rounded-md border p-3 text-sm hover:bg-accent">
                    <p className="font-medium">{client.name}</p>
                    <div className="mt-2 flex flex-wrap gap-1">{client.reasons.map((reason) => <Badge key={reason} variant={reason.includes("vencidas") || reason.includes("criticas") ? "warning" : "muted"}>{reason}</Badge>)}</div>
                  </Link>
                ))}
              </div>
            ) : <p className="rounded-md border p-4 text-sm text-muted-foreground">Sin señales fuertes de atencion.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Alertas criticas recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {(criticalAlerts || []).length ? <ul className="space-y-2 text-sm">{((criticalAlerts || []) as Array<{ id: string; title: string; sent_at: string | null }>).map((alert) => <li key={alert.id} className="rounded-md border px-3 py-2"><p className="font-medium">{alert.title}</p><p className="text-xs text-muted-foreground">{formatDate(alert.sent_at)}</p></li>)}</ul> : <p className="text-sm text-muted-foreground">Sin alertas criticas.</p>}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1fr_24rem]">
        <Card>
          <CardHeader><CardTitle>Actividad reciente</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {activity.length ? activity.map((item) => {
              const profile = firstRelation(item.profiles);
              return (
                <Link key={item.id} href={activityHref(item.entity_type, item.entity_id)} className="block rounded-md border px-3 py-2 text-sm hover:bg-accent">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.entity_type} - {profile?.full_name || profile?.email || "Sistema"}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
                  </div>
                </Link>
              );
            }) : <p className="text-sm text-muted-foreground">Sin actividad reciente.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Interacciones por tipo</CardTitle></CardHeader>
          <CardContent><InteractionTypeChart data={interactionChartData} /></CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card><CardHeader><CardTitle>Tareas por estado</CardTitle></CardHeader><CardContent><TaskStatusChart data={taskChartData} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Alertas por urgencia</CardTitle></CardHeader><CardContent><InteractionTypeChart data={alertChartData} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Reportes por tipo</CardTitle></CardHeader><CardContent><InteractionTypeChart data={reportChartData} /></CardContent></Card>
      </section>
    </>
  );
}

function TaskListCard({ title, tasks, danger = false }: { title: string; tasks: TaskWithClient[]; danger?: boolean }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {tasks.length ? (
          <ul className="space-y-2 text-sm">
            {tasks.map((task) => {
              const client = firstRelation(task.clients);
              return (
                <li key={task.id}>
                  <Link href={`/tasks/${task.id}`} className="block rounded-md border px-3 py-2 hover:bg-accent">
                    <p className="font-medium">{task.title}</p>
                    <div className="mt-1 flex flex-wrap gap-1 text-xs text-muted-foreground">
                      {client ? <Badge variant="muted">{client.name}</Badge> : null}
                      <Badge variant={danger || task.priority === "urgent" ? "warning" : "secondary"}>{task.priority}</Badge>
                      {task.due_date ? <span>{task.due_date}</span> : <span>Sin fecha</span>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : <p className="text-sm text-muted-foreground">Sin registros.</p>}
      </CardContent>
    </Card>
  );
}

function buildAttentionClients({
  overdueClientRows,
  activeClientRows,
  recentClientInteractionRows,
  criticalAlertClientRows,
  reviewReportClientRows
}: {
  overdueClientRows: unknown[];
  activeClientRows: unknown[];
  recentClientInteractionRows: unknown[];
  criticalAlertClientRows: unknown[];
  reviewReportClientRows: unknown[];
}) {
  const map = new Map<string, ClientAttention>();
  const add = (id: string | null | undefined, name: string | null | undefined, reason: string) => {
    if (!id || !name) return;
    const current = map.get(id) || { id, name, reasons: [] };
    if (!current.reasons.includes(reason)) current.reasons.push(reason);
    map.set(id, current);
  };

  (overdueClientRows as Array<{ clients: { id: string; name: string } | Array<{ id: string; name: string }> | null }>).forEach((row) => {
    const client = firstRelation(row.clients);
    add(client?.id, client?.name, "tareas vencidas");
  });

  const recentInteractionClientIds = new Set((recentClientInteractionRows as Array<{ client_id: string }>).map((row) => row.client_id));
  (activeClientRows as Array<{ id: string; name: string }>).forEach((client) => {
    if (!recentInteractionClientIds.has(client.id)) add(client.id, client.name, "sin interaccion reciente");
  });

  (criticalAlertClientRows as Array<{ clients: { id: string; name: string } | Array<{ id: string; name: string }> | null }>).forEach((row) => {
    const client = firstRelation(row.clients);
    add(client?.id, client?.name, "alertas criticas");
  });

  (reviewReportClientRows as Array<{ clients: { id: string; name: string } | Array<{ id: string; name: string }> | null }>).forEach((row) => {
    const client = firstRelation(row.clients);
    add(client?.id, client?.name, "reportes en revision");
  });

  return Array.from(map.values()).sort((a, b) => b.reasons.length - a.reasons.length);
}

function groupCount<T extends Record<string, string>>(rows: T[], key: keyof T) {
  return Object.entries(rows.reduce<Record<string, number>>((acc, row) => {
    acc[row[key]] = (acc[row[key]] || 0) + 1;
    return acc;
  }, {}));
}

function activityHref(entityType: string, entityId: string | null) {
  if (!entityId) return "/dashboard";
  if (entityType === "client") return `/clients/${entityId}`;
  if (entityType === "interaction") return `/interactions/${entityId}`;
  if (entityType === "document") return `/documents/${entityId}`;
  return `/${entityType}s/${entityId}`;
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(new Date(value)) : "-";
}
