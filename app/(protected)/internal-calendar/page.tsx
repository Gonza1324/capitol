import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { ConfirmAction } from "@/components/feedback/confirm-action";
import { InternalCalendarStatusBadge, InternalCalendarTypeBadge } from "@/components/internal-calendar/internal-calendar-badges";
import { ToastMessage } from "@/components/feedback/toast-message";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { archiveInternalCalendarEvent, changeInternalCalendarEventStatus, createInteractionFromInternalCalendarEvent } from "@/lib/actions/internal-calendar";
import { getInternalCalendarEvents } from "@/lib/data/internal-calendar";
import { firstRelation } from "@/lib/data/interactions";
import { createClient } from "@/lib/supabase/server";

const internalRoles = ["admin", "partner_director", "analyst", "assistant"];

type SearchParams = {
  toast?: string;
  day?: string;
  month?: string;
  q?: string;
  type?: string;
  status?: string;
  client?: string;
  responsible?: string;
  mine?: string;
  withoutClient?: string;
  withoutInteraction?: string;
  range?: string;
};

type CalendarItem = {
  id: string;
  kind: "event" | "task" | "interaction";
  title: string;
  date: string;
  href: string;
  type: string;
  status: string;
  clientName?: string | null;
  assignedTo?: string | null;
  clientId?: string | null;
  clientIds?: string[];
  responsibleId?: string | null;
  responsibleIds?: string[];
  interactionId?: string | null;
  taskId?: string | null;
};

export default async function InternalCalendarPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : { data: null };
  if (!profile?.role || !internalRoles.includes(profile.role)) notFound();

  const monthDate = params.month ? new Date(`${params.month}-01T12:00:00`) : new Date();
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);
  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  const queryStart = new Date(Math.min(monthStart.getTime(), new Date(`${today}T00:00:00`).getTime()));
  const queryEnd = new Date(Math.max(monthEnd.getTime(), weekEnd.getTime()));
  const selectedDay = params.day || new Date().toISOString().slice(0, 10);
  const { events, taskDeadlines, interactions } = await getInternalCalendarEvents({
    from: queryStart.toISOString(),
    to: queryEnd.toISOString()
  });

  const allItems: CalendarItem[] = [
    ...events.map((event) => {
      const client = firstRelation(event.clients);
      const assigned = firstRelation(event.profiles);
      return {
        id: event.id,
        kind: "event" as const,
        title: event.title,
        date: event.start_at,
        href: `/internal-calendar/${event.id}`,
        type: event.event_type,
        status: event.status,
        clientName: client?.name,
        assignedTo: assigned?.full_name || assigned?.email || null,
        clientId: event.client_id,
        clientIds: event.client_id ? [event.client_id] : [],
        responsibleId: event.assigned_to,
        responsibleIds: event.assigned_to ? [event.assigned_to] : [],
        interactionId: event.interaction_id,
        taskId: event.task_id
      };
    }),
    ...taskDeadlines.map((task) => {
      const client = firstRelation(task.clients);
      return {
        id: task.id,
        kind: "task" as const,
        title: task.title,
        date: `${task.due_date}T12:00:00`,
        href: `/tasks/${task.id}`,
        type: "task_deadline",
        status: task.status,
        clientName: client?.name,
        clientId: task.client_id,
        clientIds: task.client_id ? [task.client_id] : [],
        taskId: task.id
      };
    }),
    ...interactions.map((interaction) => {
      const linkedClients = (interaction.interaction_clients || []).flatMap((row) => {
        const client = firstRelation(row.clients);
        return client ? [client] : [];
      });
      const participants = (interaction.interaction_internal_participants || []).flatMap((row) => {
        const profile = firstRelation(row.profiles);
        return profile ? [profile] : [];
      });
      return {
        id: interaction.id,
        kind: "interaction" as const,
        title: interaction.title,
        date: buildInteractionDateTime(interaction.interaction_date, interaction.start_time),
        href: `/interactions/${interaction.id}`,
        type: interaction.type,
        status: "registered",
        clientName: linkedClients.map((client) => client.name).join(", ") || null,
        clientId: linkedClients[0]?.id || null,
        clientIds: linkedClients.map((client) => client.id),
        assignedTo: participants.map((participant) => participant.full_name || participant.email).filter(Boolean).join(", ") || null,
        responsibleId: interaction.created_by,
        responsibleIds: [
          interaction.created_by,
          ...participants.map((participant) => participant.id)
        ].filter(Boolean) as string[],
        interactionId: interaction.id
      };
    })
  ];
  const filteredItems = filterItems(allItems, params, user?.id || "");
  const selectedItems = filteredItems.filter((item) => dateKey(item.date) === selectedDay);
  const todayItems = filteredItems
    .filter((item) => dateKey(item.date) === today)
    .sort(sortPendingFirst);
  const weekItems = filteredItems
    .filter((item) => isWithinNextDays(item.date, 7))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const upcomingItems = filteredItems.filter((item) => new Date(item.date).getTime() >= Date.now()).slice(0, 10);
  const overdueItems = filteredItems.filter((item) => new Date(item.date).getTime() < Date.now() && !["completed", "cancelled"].includes(item.status)).slice(0, 10);
  const days = buildMonthDays(monthStart, monthEnd);
  const previousMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1).toISOString().slice(0, 7);
  const nextMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1).toISOString().slice(0, 7);

  return (
    <>
      <ToastMessage code={params.toast} />
      <PageHeader
        title="Calendario"
        description="Agenda interna de reuniones, llamados, recordatorios y vencimientos de tareas."
        actions={<Button asChild><Link href="/internal-calendar/new"><CalendarPlus className="h-4 w-4" /> Nuevo evento</Link></Button>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Button asChild variant={params.range === "today" ? "default" : "outline"} size="sm"><Link href={`/internal-calendar?range=today&day=${today}&month=${today.slice(0, 7)}`}>Hoy</Link></Button>
        <Button asChild variant={params.range === "week" ? "default" : "outline"} size="sm"><Link href="/internal-calendar?range=week">Esta semana</Link></Button>
        <Button asChild variant={params.mine === "1" ? "default" : "outline"} size="sm"><Link href="/internal-calendar?mine=1">Mis eventos</Link></Button>
        <Button asChild variant={params.withoutClient === "1" ? "default" : "outline"} size="sm"><Link href="/internal-calendar?withoutClient=1">Sin cliente asociado</Link></Button>
        <Button asChild variant={params.withoutInteraction === "1" ? "default" : "outline"} size="sm"><Link href="/internal-calendar?withoutInteraction=1">Sin interacción creada</Link></Button>
        <Button asChild variant={params.type === "task_deadline" ? "default" : "outline"} size="sm"><Link href="/internal-calendar?type=task_deadline&range=week">Tareas próximas a vencer</Link></Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{capitalize(monthStart.toLocaleDateString("es-AR", { month: "long", year: "numeric" }))}</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="icon" aria-label="Mes anterior">
                <Link href={`/internal-calendar?month=${previousMonth}`}><ChevronLeft className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="icon" aria-label="Mes siguiente">
                <Link href={`/internal-calendar?month=${nextMonth}`}><ChevronRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 border-l border-t text-xs font-medium text-muted-foreground">
              {["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"].map((label) => <div key={label} className="border-b border-r p-2">{label}</div>)}
              {days.map((day) => {
                const key = day.toISOString().slice(0, 10);
                const dayItems = filteredItems.filter((item) => dateKey(item.date) === key);
                const isSelected = key === selectedDay;
                const isToday = key === today;
                return (
                  <Link key={key} href={`/internal-calendar?month=${monthStart.toISOString().slice(0, 7)}&day=${key}`} className={`min-h-28 border-b border-r p-2 hover:bg-accent ${isSelected ? "bg-secondary" : ""} ${isToday ? "bg-capitol-accent-muted/40" : ""}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className={isToday ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-danger font-semibold text-white shadow-sm" : "font-medium text-foreground"}>
                        {day.getDate()}
                      </span>
                      {dayItems.length ? <Badge variant="muted">{dayItems.length}</Badge> : null}
                    </div>
                    <div className="space-y-1">
                      {dayItems.slice(0, 3).map((item) => <p key={`${item.kind}-${item.id}`} className="truncate rounded bg-muted px-2 py-1 text-[11px] text-foreground">{item.title}</p>)}
                      {dayItems.length > 3 ? <p className="text-[11px] text-muted-foreground">+{dayItems.length - 3} mas</p> : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <EventListCard title="Hoy" items={todayItems} empty="No hay eventos ni tareas con vencimiento para hoy." />
          <EventListCard title="Esta semana" items={weekItems} empty="Sin eventos en los próximos 7 días." />
          <EventListCard title={`Eventos del ${selectedDay}`} items={selectedItems} empty="No hay eventos para este día." />
          <EventListCard title="Próximos eventos" items={upcomingItems} empty="Sin próximos eventos." />
          <EventListCard title="Vencidos / pendientes" items={overdueItems} empty="Sin eventos vencidos pendientes." danger />
        </div>
      </div>
    </>
  );
}

function EventListCard({ title, items, empty, danger = false }: { title: string; items: CalendarItem[]; empty: string; danger?: boolean }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.length ? items.map((item) => (
          <div key={`${item.kind}-${item.id}`} className={`rounded-md border p-3 text-sm ${danger ? "border-destructive/40" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(item.date)} - {item.clientName || "Evento sin cliente"}
                  {item.kind === "task" ? " - Tarea con vencimiento" : ""}
                  {item.kind === "interaction" ? " - Reunión registrada" : ""}
                  {item.kind === "event" && !item.interactionId ? " - Pendiente de interacción" : ""}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-1">
                <InternalCalendarTypeBadge type={item.type} />
                <InternalCalendarStatusBadge status={item.status} />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm"><Link href={item.href}>Ver detalle</Link></Button>
              {item.kind === "event" ? (
                <>
                  <Button asChild variant="outline" size="sm"><Link href={`/internal-calendar/${item.id}/edit`}>Editar</Link></Button>
                  <form action={changeInternalCalendarEventStatus.bind(null, item.id, "completed", "/internal-calendar?toast=internal_calendar_event_completed")}>
                    <Button type="submit" variant="outline" size="sm">Completar</Button>
                  </form>
                  <form action={changeInternalCalendarEventStatus.bind(null, item.id, "postponed", "/internal-calendar?toast=internal_calendar_event_postponed")}>
                    <Button type="submit" variant="outline" size="sm">Posponer</Button>
                  </form>
                  {!item.interactionId ? (
                    <form action={createInteractionFromInternalCalendarEvent.bind(null, item.id)}>
                      <Button type="submit" size="sm">Registrar interacción</Button>
                    </form>
                  ) : null}
                  <ConfirmAction
                    label="Cancelar evento"
                    variant="destructive"
                    confirmMessage={`Cancelar ${item.title}?`}
                    action={archiveInternalCalendarEvent.bind(null, item.id, "/internal-calendar?toast=internal_calendar_event_cancelled")}
                  />
                </>
              ) : null}
              {item.clientId ? <Button asChild variant="ghost" size="sm"><Link href={`/clients/${item.clientId}`}>Ver cliente</Link></Button> : null}
              {item.taskId ? <Button asChild variant="ghost" size="sm"><Link href={`/tasks/${item.taskId}`}>Ver tarea</Link></Button> : null}
              {item.kind === "interaction" ? <Button asChild variant="ghost" size="sm"><Link href={`/interactions/${item.id}`}>Ver reunión</Link></Button> : null}
            </div>
          </div>
        )) : <p className="rounded-md border p-3 text-sm text-muted-foreground">{empty}</p>}
      </CardContent>
    </Card>
  );
}

function buildMonthDays(monthStart: Date, monthEnd: Date) {
  const start = new Date(monthStart);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(monthEnd);
  end.setDate(end.getDate() + (6 - end.getDay()));
  const days: Date[] = [];
  for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    days.push(new Date(day));
  }
  return days;
}

function filterItems(items: CalendarItem[], params: SearchParams, currentUserId: string) {
  return items.filter((item) => {
    const text = (params.q || "").toLowerCase();
    if (text && !`${item.title} ${item.clientName || ""}`.toLowerCase().includes(text)) return false;
    if (params.type && item.type !== params.type) return false;
    if (params.status && item.status !== params.status) return false;
    if (params.client && !(item.clientIds || [item.clientId]).filter(Boolean).includes(params.client)) return false;
    if (params.responsible && !(item.responsibleIds || [item.responsibleId]).filter(Boolean).includes(params.responsible)) return false;
    if (params.mine === "1" && !(item.responsibleIds || [item.responsibleId]).filter(Boolean).includes(currentUserId)) return false;
    if (params.withoutClient === "1" && item.clientId) return false;
    if (params.withoutInteraction === "1" && (item.kind !== "event" || item.interactionId)) return false;
    if (params.range === "today" && dateKey(item.date) !== new Date().toISOString().slice(0, 10)) return false;
    if (params.range === "week" && !isWithinNextDays(item.date, 7)) return false;
    return true;
  });
}

function sortPendingFirst(a: CalendarItem, b: CalendarItem) {
  const aDone = ["completed", "cancelled"].includes(a.status);
  const bDone = ["completed", "cancelled"].includes(b.status);
  if (aDone !== bDone) return aDone ? 1 : -1;
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

function isWithinNextDays(value: string, days: number) {
  const time = new Date(value).getTime();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  end.setHours(23, 59, 59, 999);
  return time >= start.getTime() && time <= end.getTime();
}

function dateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function buildInteractionDateTime(date: string, time?: string | null) {
  return `${date}T${time || "12:00:00"}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
