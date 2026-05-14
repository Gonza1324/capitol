"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FilterX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientTimelineEvent } from "@/lib/data/client-history";

export function ClientHistoryTimeline({ events }: { events: ClientTimelineEvent[] }) {
  const [filters, setFilters] = useState({ type: "", from: "", to: "", responsible: "", status: "" });
  const responsibleOptions = useMemo(() => Array.from(new Set(events.flatMap((event) => event.responsible ? [event.responsible] : []))).sort(), [events]);
  const statusOptions = useMemo(() => Array.from(new Set(events.flatMap((event) => event.status || event.priority ? [event.status || event.priority || ""] : []))).filter(Boolean).sort(), [events]);
  const filtered = useMemo(() => events.filter((event) => (
    (!filters.type || event.type === filters.type)
    && (!filters.from || event.date.slice(0, 10) >= filters.from)
    && (!filters.to || event.date.slice(0, 10) <= filters.to)
    && (!filters.responsible || event.responsible === filters.responsible)
    && (!filters.status || event.status === filters.status || event.priority === filters.status)
  )), [events, filters]);

  return (
    <Card className="print:shadow-none">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>Historial del cliente</CardTitle>
          <CardDescription>Timeline consolidado de trabajo, comunicaciones, documentos y actividad.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-md border bg-muted/20 p-3 print:hidden md:grid-cols-5">
          <select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">Tipo de evento</option>
            {["interaction", "task", "report", "alert", "document", "stakeholder", "activity"].map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <Input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} />
          <Input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} />
          <select value={filters.responsible} onChange={(event) => setFilters((current) => ({ ...current, responsible: event.target.value }))} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">Responsable</option>
            {responsibleOptions.map((responsible) => <option key={responsible} value={responsible}>{responsible}</option>)}
          </select>
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">Estado / prioridad</option>
            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <Button type="button" variant="outline" className="md:col-span-5" onClick={() => setFilters({ type: "", from: "", to: "", responsible: "", status: "" })}>
            <FilterX className="h-4 w-4" />
            Limpiar filtros
          </Button>
        </div>

        {!events.length ? (
          <p className="rounded-md border p-4 text-sm text-muted-foreground">Sin historial para este cliente.</p>
        ) : !filtered.length ? (
          <p className="rounded-md border p-4 text-sm text-muted-foreground">Sin resultados con los filtros aplicados.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((event) => (
              <article key={event.id} className="rounded-md border p-4 text-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <EventBadge type={event.type} />
                      {event.status ? <Badge variant="muted">{event.status}</Badge> : null}
                      {event.priority ? <Badge variant={["urgent", "critical", "high"].includes(event.priority) ? "warning" : "secondary"}>{event.priority}</Badge> : null}
                    </div>
                    {event.href ? <Link href={event.href} className="font-medium hover:underline">{event.title}</Link> : <p className="font-medium">{event.title}</p>}
                    {event.description ? <p className="mt-2 line-clamp-3 text-muted-foreground">{event.description}</p> : null}
                    <p className="mt-2 text-xs text-muted-foreground">{event.clientName}{event.responsible ? ` - ${event.responsible}` : ""}</p>
                  </div>
                  <time className="text-xs text-muted-foreground md:text-right">{formatDate(event.date)}</time>
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EventBadge({ type }: { type: ClientTimelineEvent["type"] }) {
  const variant = type === "alert" ? "warning" : type === "task" ? "secondary" : type === "document" ? "success" : "muted";
  return <Badge variant={variant}>{type}</Badge>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
