import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ConfirmAction } from "@/components/feedback/confirm-action";
import { ToastMessage } from "@/components/feedback/toast-message";
import { InternalCalendarSourceBadge, InternalCalendarStatusBadge, InternalCalendarTypeBadge } from "@/components/internal-calendar/internal-calendar-badges";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { archiveInternalCalendarEvent, changeInternalCalendarEventStatus, createInteractionFromInternalCalendarEvent, generateInternalCalendarOccurrences } from "@/lib/actions/internal-calendar";
import { firstRelation } from "@/lib/data/interactions";
import { createClient } from "@/lib/supabase/server";

const internalRoles = ["admin", "partner_director", "analyst", "assistant"];

type EventDetail = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  event_type: string;
  status: string;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  timezone: string;
  location: string | null;
  meeting_url: string | null;
  client_id: string | null;
  contact_id: string | null;
  stakeholder_id: string | null;
  task_id: string | null;
  interaction_id: string | null;
  assigned_to: string | null;
  source: string;
  sync_status: string;
  recurrence_rule: string | null;
  is_recurring: boolean;
  recurrence_interval: number | null;
  recurrence_ends_at: string | null;
  recurrence_count: number | null;
  parent_recurring_id: string | null;
  generated_from_recurring_id: string | null;
  next_occurrence_at: string | null;
  clients?: { id: string; name: string } | { id: string; name: string }[] | null;
  contacts?: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
  stakeholders?: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
  tasks?: { id: string; title: string } | { id: string; title: string }[] | null;
  interactions?: { id: string; title: string } | { id: string; title: string }[] | null;
  profiles?: { id: string; full_name: string | null; email: string | null } | { id: string; full_name: string | null; email: string | null }[] | null;
};

type SeriesEventRow = {
  id: string;
  title: string;
  status: string;
  event_type: string;
  start_at: string;
  generated_from_recurring_id: string | null;
};

export default async function InternalCalendarEventDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ toast?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : { data: null };
  if (!profile?.role || !internalRoles.includes(profile.role)) notFound();

  const [{ data: event }, { data: activity }] = await Promise.all([
    supabase
      .from("internal_calendar_events")
      .select("*, clients(id, name), contacts(id, full_name), stakeholders(id, full_name), tasks(id, title), interactions(id, title), profiles:assigned_to(id, full_name, email)")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase.from("activity_log").select("action, created_at").eq("entity_type", "internal_calendar_event").eq("entity_id", id).order("created_at", { ascending: false }).limit(10)
  ]);
  if (!event) notFound();

  const detail = event as unknown as EventDetail;
  const seriesRootId = detail.generated_from_recurring_id || detail.id;
  const { data: seriesRows } = await supabase
    .from("internal_calendar_events")
    .select("id, title, status, event_type, start_at, generated_from_recurring_id")
    .or(`id.eq.${seriesRootId},generated_from_recurring_id.eq.${seriesRootId}`)
    .is("deleted_at", null)
    .order("start_at", { ascending: true });
  const client = firstRelation(detail.clients);
  const contact = firstRelation(detail.contacts);
  const stakeholder = firstRelation(detail.stakeholders);
  const task = firstRelation(detail.tasks);
  const interaction = firstRelation(detail.interactions);
  const assigned = firstRelation(detail.profiles);

  return (
    <>
      <ToastMessage code={query.toast} />
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/internal-calendar"><ArrowLeft className="h-4 w-4" /> Volver al calendario</Link>
        </Button>
      </div>
      <PageHeader
        title={detail.title}
        description={formatDateRange(detail.start_at, detail.end_at)}
        actions={<Button asChild><Link href={`/internal-calendar/${detail.id}/edit`}>Editar evento</Link></Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Detalle del evento</CardTitle>
            <CardDescription>Agenda interna preparada para futura sincronizacion externa.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <Info label="Tipo"><InternalCalendarTypeBadge type={detail.event_type} /></Info>
            <Info label="Estado"><InternalCalendarStatusBadge status={detail.status} /></Info>
            <Info label="Fuente"><InternalCalendarSourceBadge source={detail.source} /></Info>
            <Info label="Sync futura"><Badge variant="muted">{detail.sync_status}</Badge></Info>
            <Info label="Responsable">{assigned?.full_name || assigned?.email || "-"}</Info>
            <Info label="Todo el dia">{detail.all_day ? "Si" : "No"}</Info>
            <Info label="Cliente">{client ? <Link className="text-primary underline" href={`/clients/${client.id}`}>{client.name}</Link> : "Evento sin cliente"}</Info>
            <Info label="Contacto">{contact?.full_name || "-"}</Info>
            <Info label="Stakeholder">{stakeholder ? <Link className="text-primary underline" href={`/stakeholders/${stakeholder.id}`}>{stakeholder.full_name}</Link> : "-"}</Info>
            <Info label="Tarea asociada">{task ? <Link className="text-primary underline" href={`/tasks/${task.id}`}>{task.title}</Link> : "-"}</Info>
            <Info label="Interaccion">{interaction ? <Link className="text-primary underline" href={`/interactions/${interaction.id}`}>{interaction.title}</Link> : "-"}</Info>
            <Info label="Ubicacion">{detail.location || "-"}</Info>
            <Info label="Link de reunion">{detail.meeting_url ? <a className="text-primary underline" href={detail.meeting_url} target="_blank" rel="noreferrer">Abrir link</a> : "-"}</Info>
            <Info label="Recurrencia">
              <div className="flex flex-wrap gap-1">
                {detail.is_recurring ? <Badge variant="accent">Recurrente</Badge> : null}
                {detail.generated_from_recurring_id ? <Badge variant="info">Ocurrencia</Badge> : null}
                {!detail.is_recurring && !detail.generated_from_recurring_id ? <span>No</span> : null}
                {detail.is_recurring ? <Badge variant="muted">{formatRecurrence(detail.recurrence_rule, detail.recurrence_interval)}</Badge> : null}
              </div>
            </Info>
            <Info label="Próxima ocurrencia">{detail.next_occurrence_at ? formatDateTime(detail.next_occurrence_at) : "-"}</Info>
            <Info label="Fin de recurrencia">{detail.recurrence_ends_at ? formatDateTime(detail.recurrence_ends_at) : "-"}</Info>
            <Info label="Descripcion" wide>{detail.description || "-"}</Info>
            <Info label="Notas" wide>{detail.notes || "-"}</Info>
          </CardContent>
        </Card>

        <aside className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {detail.is_recurring ? (
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 90].map((days) => (
                    <form key={days} action={generateInternalCalendarOccurrences.bind(null, detail.id, days, `/internal-calendar/${detail.id}?toast=internal_calendar_occurrences_generated`)}>
                      <Button type="submit" className="w-full" variant="outline" size="sm">{days} días</Button>
                    </form>
                  ))}
                </div>
              ) : null}
              <form action={changeInternalCalendarEventStatus.bind(null, detail.id, "completed", `/internal-calendar/${detail.id}?toast=internal_calendar_event_completed`)}>
                <Button type="submit" className="w-full" variant="outline">Marcar completado</Button>
              </form>
              <form action={changeInternalCalendarEventStatus.bind(null, detail.id, "postponed", `/internal-calendar/${detail.id}?toast=internal_calendar_event_postponed`)}>
                <Button type="submit" className="w-full" variant="outline">Posponer</Button>
              </form>
              <form action={createInteractionFromInternalCalendarEvent.bind(null, detail.id)}>
                <Button type="submit" className="w-full" disabled={Boolean(interaction)}>Registrar interacción</Button>
              </form>
              <ConfirmAction
                label={detail.generated_from_recurring_id ? "Cancelar esta ocurrencia" : "Cancelar evento"}
                variant="destructive"
                confirmMessage={`Cancelar ${detail.title}?`}
                action={archiveInternalCalendarEvent.bind(null, detail.id, "/internal-calendar?toast=internal_calendar_event_cancelled")}
              />
            </CardContent>
          </Card>
          {(detail.is_recurring || detail.generated_from_recurring_id) ? (
            <Card>
              <CardHeader><CardTitle>Serie</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {((seriesRows || []) as SeriesEventRow[]).map((item) => (
                  <div key={item.id} className="rounded-md border px-3 py-2 text-sm">
                    <Link className="font-medium hover:underline" href={`/internal-calendar/${item.id}`}>{item.title}</Link>
                    <p className="text-xs text-muted-foreground">{formatDateTime(item.start_at)}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.generated_from_recurring_id ? <Badge variant="info">Ocurrencia</Badge> : <Badge variant="accent">Serie</Badge>}
                      <InternalCalendarTypeBadge type={item.event_type} />
                      <InternalCalendarStatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader><CardTitle>Actividad</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {((activity || []) as Array<{ action: string; created_at: string }>).length ? ((activity || []) as Array<{ action: string; created_at: string }>).map((item) => (
                <div key={`${item.action}-${item.created_at}`} className="rounded-md border px-3 py-2 text-sm">
                  <p className="font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>}
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

function formatDateRange(start: string, end: string | null) {
  const startLabel = formatDateTime(start);
  return end ? `${startLabel} - ${formatTime(end)}` : startLabel;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatRecurrence(rule: string | null, interval?: number | null) {
  const every = interval && interval > 1 ? `cada ${interval}` : "cada";
  if (rule === "daily") return `${every} día${interval && interval > 1 ? "s" : ""}`;
  if (rule === "weekly") return `${every} semana${interval && interval > 1 ? "s" : ""}`;
  if (rule === "monthly") return `${every} mes${interval && interval > 1 ? "es" : ""}`;
  return `${every} ${interval && interval > 1 ? "días" : "día"}`;
}
