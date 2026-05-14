import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ToastMessage } from "@/components/feedback/toast-message";
import { ConfirmAction } from "@/components/feedback/confirm-action";
import { TaskCommentForm } from "@/components/tasks/task-comment-form";
import { isOverdue, TaskPriorityBadge, TaskStatusBadge } from "@/components/tasks/task-badges";
import { archiveTaskRecord, changeTaskStatus, createTaskComment } from "@/lib/actions/tasks";
import { firstRelation } from "@/lib/data/tasks";
import { createClient } from "@/lib/supabase/server";
import { EntityDocuments } from "@/components/documents/entity-documents";

type TaskDetail = {
  id: string;
  title: string;
  description: string | null;
  client_id: string | null;
  status: "pending" | "in_progress" | "in_review" | "completed" | "cancelled";
  priority: string;
  due_date: string | null;
  created_by: string | null;
  origin_type: string | null;
  origin_id: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  clients?: { name: string } | Array<{ name: string }> | null;
};

type AssigneeRow = {
  profiles: { id: string; full_name: string | null; email: string | null } | Array<{ id: string; full_name: string | null; email: string | null }> | null;
};

type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  profiles?: { full_name: string | null; email: string | null } | Array<{ full_name: string | null; email: string | null }> | null;
};

export default async function TaskDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ toast?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const [{ data: task }, { data: assignees }, { data: comments }, { data: activity }, { data: profiles }] = await Promise.all([
    supabase.from("tasks").select("*, clients(name)").eq("id", id).is("deleted_at", null).maybeSingle(),
    supabase.from("task_assignees").select("profiles(id, full_name, email)").eq("task_id", id),
    supabase.from("task_comments").select("id, body, created_at, profiles(full_name, email)").eq("task_id", id).is("deleted_at", null).order("created_at", { ascending: false }),
    supabase.from("activity_log").select("action, created_at").eq("entity_type", "task").eq("entity_id", id).order("created_at", { ascending: false }).limit(10),
    supabase.from("profiles").select("id, full_name, email")
  ]);

  if (!task) notFound();

  const detail = task as unknown as TaskDetail;
  const client = firstRelation(detail.clients);
  const profileLabels = new Map(((profiles || []) as Array<{ id: string; full_name: string | null; email: string | null }>).map((profile) => [profile.id, profile.full_name || profile.email || "Usuario"]));
  const creator = detail.created_by ? profileLabels.get(detail.created_by) || null : null;
  const assigneeLabels = ((assignees || []) as unknown as AssigneeRow[]).flatMap((item) => {
    const profile = firstRelation(item.profiles);
    return profile ? [profile.full_name || profile.email || "Usuario"] : [];
  });

  return (
    <>
      <ToastMessage code={query.toast} />
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/tasks"><ArrowLeft className="h-4 w-4" /> Volver a tareas</Link>
        </Button>
      </div>
      <PageHeader
        title={detail.title}
        description={client?.name || "Tarea interna"}
        actions={<Button asChild><Link href={`/tasks/${detail.id}/edit`}>Editar tarea</Link></Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalle</CardTitle>
              <CardDescription>Estado operativo, responsables y vencimientos.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <Info label="Estado"><TaskStatusBadge status={detail.status} /></Info>
              <Info label="Prioridad"><TaskPriorityBadge priority={detail.priority} /></Info>
              <Info label="Cliente">{detail.client_id ? <Link className="text-primary underline" href={`/clients/${detail.client_id}`}>{client?.name || "Ver cliente"}</Link> : "-"}</Info>
              <Info label="Responsables"><BadgeGroup values={assigneeLabels} /></Info>
              <Info label="Fecha limite">
                <span className={isOverdue(detail.due_date, detail.status) ? "text-destructive" : ""}>{detail.due_date || "-"}</span>
              </Info>
              <Info label="Creada por">{creator || "-"}</Info>
              <Info label="Creacion">{formatDateTime(detail.created_at)}</Info>
              <Info label="Actualizacion">{formatDateTime(detail.updated_at)}</Info>
              <Info label="Completada">{detail.completed_at ? formatDateTime(detail.completed_at) : "-"}</Info>
              <Info label="Recurrencia">{detail.is_recurring ? detail.recurrence_rule || "custom" : "No recurrente"}</Info>
              <Info label="Descripcion" wide>{detail.description || "-"}</Info>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comentarios</CardTitle>
              <CardDescription>Historial interno de seguimiento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TaskCommentForm action={createTaskComment.bind(null, detail.id)} />
              <div className="space-y-3">
                {((comments || []) as unknown as CommentRow[]).length ? ((comments || []) as unknown as CommentRow[]).map((comment) => {
                  const author = firstRelation(comment.profiles);
                  return (
                    <div key={comment.id} className="rounded-md border p-3">
                      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>{author?.full_name || author?.email || "Usuario"}</span>
                        <span>{formatDateTime(comment.created_at)}</span>
                      </div>
                      <p className="text-sm">{comment.body}</p>
                    </div>
                  );
                }) : <p className="rounded-md border p-4 text-sm text-muted-foreground">Sin comentarios todavia.</p>}
              </div>
            </CardContent>
          </Card>
          <EntityDocuments entityType="task" entityId={detail.id} />
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {detail.status !== "completed" ? (
                <form action={changeTaskStatus.bind(null, detail.id, "completed", detail.client_id, `/tasks/${detail.id}?toast=task_completed`)}>
                  <Button className="w-full" type="submit">Marcar completada</Button>
                </form>
              ) : (
                <form action={changeTaskStatus.bind(null, detail.id, "in_progress", detail.client_id, `/tasks/${detail.id}?toast=task_reopened`)}>
                  <Button className="w-full" type="submit" variant="outline">Reabrir tarea</Button>
                </form>
              )}
              <div className="grid grid-cols-2 gap-2">
                {(["pending", "in_progress", "in_review", "cancelled"] as const).map((status) => (
                  <form key={status} action={changeTaskStatus.bind(null, detail.id, status, detail.client_id, `/tasks/${detail.id}?toast=task_status_changed`)}>
                    <Button className="w-full" type="submit" variant="outline" size="sm">{status}</Button>
                  </form>
                ))}
              </div>
              <ConfirmAction
                label="Archivar"
                variant="destructive"
                confirmMessage={`Archivar ${detail.title}?`}
                action={archiveTaskRecord.bind(null, detail.id, detail.client_id, "/tasks?toast=task_archived")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {((activity || []) as Array<{ action: string; created_at: string }>).length ? (
                ((activity || []) as Array<{ action: string; created_at: string }>).map((item) => (
                  <div key={`${item.action}-${item.created_at}`} className="rounded-md border px-3 py-2 text-sm">
                    <p className="font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}

function Info({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function BadgeGroup({ values }: { values: string[] }) {
  if (!values.length) return <span className="text-muted-foreground">-</span>;
  return <div className="flex flex-wrap gap-1">{values.map((value) => <Badge key={value} variant="muted">{value}</Badge>)}</div>;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
