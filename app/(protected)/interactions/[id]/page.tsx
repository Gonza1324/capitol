import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, SquareCheckBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ToastMessage } from "@/components/feedback/toast-message";
import { ConfirmAction } from "@/components/feedback/confirm-action";
import { TaskForm } from "@/components/forms/task-form";
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/tasks/task-badges";
import { archiveInteractionRecord, createDerivedTask } from "@/lib/actions/interactions";
import { firstRelation } from "@/lib/data/interactions";
import { getTaskFormOptions } from "@/lib/data/tasks";
import { createClient } from "@/lib/supabase/server";
import { formatInteractionDate, InteractionTypeBadge } from "@/components/interactions/interaction-badges";
import { EntityDocuments } from "@/components/documents/entity-documents";

type InteractionDetail = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  interaction_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  google_calendar_event_id: string | null;
  google_meet_url: string | null;
  summary: string | null;
  notes: string | null;
  decisions: string | null;
  risks: string | null;
  next_steps: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type ClientRel = { clients: { id: string; name: string } | Array<{ id: string; name: string }> | null };
type InternalRel = { profiles: { id: string; full_name: string | null; email: string | null } | Array<{ id: string; full_name: string | null; email: string | null }> | null };
type ExternalRel = {
  name: string | null;
  email: string | null;
  contacts: { full_name: string; email: string | null } | Array<{ full_name: string; email: string | null }> | null;
  stakeholders: { id: string; full_name: string; organization: string | null } | Array<{ id: string; full_name: string; organization: string | null }> | null;
};
type DerivedTask = { id: string; title: string; status: string; priority: string; due_date: string | null };

export default async function InteractionDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ toast?: string }>;
}) {
  const [{ id }, query, taskOptions] = await Promise.all([params, searchParams, getTaskFormOptions()]);
  const supabase = await createClient();
  const [
    { data: interaction },
    { data: clients },
    { data: internal },
    { data: external },
    { data: tasks },
    { data: activity },
    { data: profiles }
  ] = await Promise.all([
    supabase.from("interactions").select("*").eq("id", id).is("deleted_at", null).maybeSingle(),
    supabase.from("interaction_clients").select("clients(id, name)").eq("interaction_id", id),
    supabase.from("interaction_internal_participants").select("profiles(id, full_name, email)").eq("interaction_id", id),
    supabase.from("interaction_external_participants").select("name, email, contacts(full_name, email), stakeholders(id, full_name, organization)").eq("interaction_id", id),
    supabase.from("tasks").select("id, title, status, priority, due_date").eq("origin_type", "interaction").eq("origin_id", id).is("deleted_at", null).order("created_at", { ascending: false }),
    supabase.from("activity_log").select("action, created_at").eq("entity_type", "interaction").eq("entity_id", id).order("created_at", { ascending: false }).limit(10),
    supabase.from("profiles").select("id, full_name, email")
  ]);

  if (!interaction) notFound();

  const detail = interaction as unknown as InteractionDetail;
  const linkedClients = ((clients || []) as unknown as ClientRel[]).flatMap((item) => {
    const client = firstRelation(item.clients);
    return client ? [client] : [];
  });
  const internalParticipants = ((internal || []) as unknown as InternalRel[]).flatMap((item) => {
    const profile = firstRelation(item.profiles);
    return profile ? [{ id: profile.id, label: profile.full_name || profile.email || "Usuario" }] : [];
  });
  const externalParticipants = ((external || []) as unknown as ExternalRel[]).map((item) => {
    const contact = firstRelation(item.contacts);
    const stakeholder = firstRelation(item.stakeholders);
    return {
      label: contact?.full_name || stakeholder?.full_name || item.name || item.email || "Participante",
      href: stakeholder ? `/stakeholders/${stakeholder.id}` : undefined
    };
  });
  const profileLabels = new Map(((profiles || []) as Array<{ id: string; full_name: string | null; email: string | null }>).map((profile) => [profile.id, profile.full_name || profile.email || "Usuario"]));
  const firstClientId = linkedClients[0]?.id || "";

  return (
    <>
      <ToastMessage code={query.toast} />
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/interactions"><ArrowLeft className="h-4 w-4" /> Volver a interacciones</Link>
        </Button>
      </div>
      <PageHeader
        title={detail.title}
        description={formatInteractionDate(detail.interaction_date, detail.start_time, detail.end_time)}
        actions={<Button asChild><Link href={`/interactions/${detail.id}/edit`}>Editar</Link></Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalle</CardTitle>
              <CardDescription>Registro interno de la interaccion.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <Info label="Tipo"><InteractionTypeBadge type={detail.type} /></Info>
              <Info label="Lugar">{detail.location || "-"}</Info>
              <Info label="Clientes"><LinkBadges values={linkedClients.map((client) => ({ href: `/clients/${client.id}`, label: client.name }))} /></Info>
              <Info label="Participantes internos"><BadgeGroup values={internalParticipants.map((item) => item.label)} /></Info>
              <Info label="Participantes externos"><LinkBadges values={externalParticipants} /></Info>
              <Info label="Creada por">{detail.created_by ? profileLabels.get(detail.created_by) || "-" : "-"}</Info>
              <Info label="Google Meet">{detail.google_meet_url ? <a className="text-primary underline" href={detail.google_meet_url} target="_blank">Abrir Meet</a> : "-"}</Info>
              <Info label="Calendar Event ID">{detail.google_calendar_event_id || "-"}</Info>
              <Info label="Descripcion" wide>{detail.description || "-"}</Info>
              <Info label="Resumen" wide>{detail.summary || "-"}</Info>
              <Info label="Notas" wide>{detail.notes || "-"}</Info>
              <Info label="Decisiones">{detail.decisions || "-"}</Info>
              <Info label="Riesgos">{detail.risks || "-"}</Info>
              <Info label="Proximos pasos" wide>{detail.next_steps || "-"}</Info>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tareas derivadas</CardTitle>
              <CardDescription>Seguimiento creado a partir de esta interaccion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {((tasks || []) as DerivedTask[]).length ? (
                <div className="grid gap-3">
                  {((tasks || []) as DerivedTask[]).map((task) => (
                    <Link key={task.id} href={`/tasks/${task.id}`} className="rounded-md border p-3 text-sm hover:bg-accent">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{task.title}</p>
                        <div className="flex gap-1">
                          <TaskStatusBadge status={task.status} />
                          <TaskPriorityBadge priority={task.priority} />
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{task.due_date || "Sin vencimiento"}</p>
                    </Link>
                  ))}
                </div>
              ) : <p className="rounded-md border p-4 text-sm text-muted-foreground">Sin tareas derivadas.</p>}
              <div className="rounded-md border p-4">
                <h3 className="mb-4 flex items-center gap-2 font-medium"><SquareCheckBig className="h-4 w-4" /> Crear tarea desde esta interaccion</h3>
                <TaskForm
                  action={createDerivedTask.bind(null, detail.id)}
                  clients={taskOptions.clients}
                  profiles={taskOptions.profiles}
                  lockedClientId={firstClientId || undefined}
                  task={{
                    title: `Seguimiento: ${detail.title}`,
                    description: detail.next_steps || detail.summary || detail.description || "",
                    client_id: firstClientId,
                    priority: "medium",
                    status: "pending",
                    origin_type: "interaction",
                    origin_id: detail.id
                  }}
                />
              </div>
            </CardContent>
          </Card>
          <EntityDocuments entityType="interaction" entityId={detail.id} />
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full" variant="outline">
                <Link href={`/tasks/new?originType=interaction&originId=${detail.id}&clientId=${firstClientId}`}>Crear tarea derivada</Link>
              </Button>
              <ConfirmAction
                label="Archivar"
                variant="destructive"
                confirmMessage={`Archivar ${detail.title}?`}
                action={archiveInteractionRecord.bind(null, detail.id, linkedClients.map((client) => client.id), "/interactions?toast=interaction_archived")}
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
              ) : <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>}
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
      <div className="text-sm whitespace-pre-wrap">{children}</div>
    </div>
  );
}

function BadgeGroup({ values }: { values: string[] }) {
  if (!values.length) return <span className="text-muted-foreground">-</span>;
  return <div className="flex flex-wrap gap-1">{values.map((value) => <Badge key={value} variant="muted">{value}</Badge>)}</div>;
}

function LinkBadges({ values }: { values: Array<{ href?: string; label: string }> }) {
  if (!values.length) return <span className="text-muted-foreground">-</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {values.map((value) => (
        <Badge key={`${value.href || value.label}-${value.label}`} variant="muted">
          {value.href ? <Link href={value.href}>{value.label}</Link> : value.label}
        </Badge>
      ))}
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
