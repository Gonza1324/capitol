import Link from "next/link";
import { CalendarDays, ExternalLink, Link2 } from "lucide-react";
import { createInteractionFromCalendarEvent, linkCalendarEventToClient } from "@/lib/actions/google-calendar";
import type { CalendarEventRow } from "@/lib/data/google-calendar";
import { firstRelation } from "@/lib/data/interactions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function CalendarEventCard({
  event,
  clients = [],
  compact = false
}: {
  event: CalendarEventRow;
  clients?: Array<{ id: string; name: string }>;
  compact?: boolean;
}) {
  const client = firstRelation(event.clients);
  const interaction = firstRelation(event.interactions);
  const dateLabel = formatCalendarEventDate(event);

  return (
    <div className="rounded-md border bg-card p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <p className="font-medium">{event.summary || "Evento sin titulo"}</p>
          </div>
          <p className="text-muted-foreground">{dateLabel}</p>
          {event.location ? <p className="text-muted-foreground">{event.location}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {client ? <Badge variant="secondary">{client.name}</Badge> : <Badge variant="muted">Sin cliente</Badge>}
          {interaction ? <Badge variant="success">Interaccion creada</Badge> : null}
        </div>
      </div>

      {event.description && !compact ? (
        <p className="mt-3 line-clamp-3 text-muted-foreground">{stripHtml(event.description)}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {event.html_link ? (
          <Button asChild variant="outline" size="sm">
            <a href={event.html_link} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" /> Abrir en Google
            </a>
          </Button>
        ) : null}
        {event.meet_url ? (
          <Button asChild variant="outline" size="sm">
            <a href={event.meet_url} target="_blank" rel="noreferrer">
              <Link2 className="h-4 w-4" /> Meet
            </a>
          </Button>
        ) : null}
        {interaction ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/interactions/${interaction.id}`}>Ver interaccion</Link>
          </Button>
        ) : (
          <form action={createInteractionFromCalendarEvent.bind(null, event.id)}>
            <Button type="submit" size="sm">Crear interaccion</Button>
          </form>
        )}
      </div>

      {clients.length ? (
        <form action={linkCalendarEventToClient.bind(null, event.id)} className="mt-4 flex flex-wrap items-center gap-2">
          <select
            name="client_id"
            defaultValue={event.client_id || ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Cliente asociado"
          >
            <option value="">Sin cliente asociado</option>
            {clients.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <Button type="submit" variant="secondary" size="sm">Asociar cliente</Button>
        </form>
      ) : null}
    </div>
  );
}

export function formatCalendarEventDate(event: Pick<CalendarEventRow, "start_at" | "end_at" | "start_date" | "end_date">) {
  if (event.start_at) {
    const start = new Date(event.start_at);
    const end = event.end_at ? new Date(event.end_at) : null;
    const startLabel = new Intl.DateTimeFormat("es-AR", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Argentina/Buenos_Aires"
    }).format(start);
    const endLabel = end
      ? new Intl.DateTimeFormat("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Argentina/Buenos_Aires"
      }).format(end)
      : null;
    return endLabel ? `${startLabel} - ${endLabel}` : startLabel;
  }

  if (event.start_date) return event.start_date;
  return "Sin fecha";
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
