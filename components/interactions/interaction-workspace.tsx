"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Eye, Pencil, SquareCheckBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { archiveInteractionRecord } from "@/lib/actions/interactions";
import { formatInteractionDate, InteractionTypeBadge } from "./interaction-badges";

export type InteractionListRow = {
  id: string;
  title: string;
  type: string;
  description: string | null;
  interaction_date: string | null;
  start_time: string | null;
  end_time: string | null;
  summary: string | null;
  notes: string | null;
  decisions: string | null;
  risks: string | null;
  next_steps: string | null;
  created_by_name: string | null;
  updated_at: string;
  clients: { id: string; name: string }[];
  internalParticipants: { id: string; label: string }[];
  externalParticipants: string[];
  derivedTaskCount: number;
};

type Filters = {
  type: string;
  clientId: string;
  internalId: string;
  dateFrom: string;
  dateTo: string;
  special: "" | "without_client" | "recent" | "with_tasks";
};

export function InteractionWorkspace({
  interactions,
  clients,
  profiles
}: {
  interactions: InteractionListRow[];
  clients: { id: string; name: string }[];
  profiles: { id: string; label: string }[];
}) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({ type: "", clientId: "", internalId: "", dateFrom: "", dateTo: "", special: "" });

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const recentThreshold = new Date();
    recentThreshold.setDate(recentThreshold.getDate() - 14);
    const recentIso = recentThreshold.toISOString().slice(0, 10);

    return interactions.filter((interaction) => {
      const haystack = [
        interaction.title,
        interaction.description,
        interaction.summary,
        interaction.notes,
        interaction.decisions,
        interaction.risks,
        interaction.next_steps,
        ...interaction.clients.map((item) => item.name),
        ...interaction.internalParticipants.map((item) => item.label),
        ...interaction.externalParticipants
      ].filter(Boolean).join(" ").toLowerCase();

      return (
        (!needle || haystack.includes(needle)) &&
        (!filters.type || interaction.type === filters.type) &&
        (!filters.clientId || interaction.clients.some((client) => client.id === filters.clientId)) &&
        (!filters.internalId || interaction.internalParticipants.some((participant) => participant.id === filters.internalId)) &&
        (!filters.dateFrom || (interaction.interaction_date || "") >= filters.dateFrom) &&
        (!filters.dateTo || (interaction.interaction_date || "") <= filters.dateTo) &&
        (filters.special !== "without_client" || interaction.clients.length === 0) &&
        (filters.special !== "recent" || Boolean(interaction.interaction_date && interaction.interaction_date >= recentIso)) &&
        (filters.special !== "with_tasks" || interaction.derivedTaskCount > 0)
      );
    });
  }, [filters, interactions, search]);

  if (!interactions.length) {
    return <EmptyState message="Todavia no hay interacciones creadas" />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-3 lg:grid-cols-7">
        <Input className="md:col-span-3 lg:col-span-2" placeholder="Buscar por titulo, resumen, notas..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <FilterSelect label="Tipo" value={filters.type} options={["call", "in_person_meeting", "important_email", "whatsapp", "lunch", "presentation", "stakeholder_meeting", "internal_meeting", "other"]} onChange={(value) => setFilters((current) => ({ ...current, type: value }))} />
        <FilterSelect label="Cliente" value={filters.clientId} options={clients.map((client) => ({ label: client.name, value: client.id }))} onChange={(value) => setFilters((current) => ({ ...current, clientId: value }))} />
        <FilterSelect label="Participante interno" value={filters.internalId} options={profiles.map((profile) => ({ label: profile.label, value: profile.id }))} onChange={(value) => setFilters((current) => ({ ...current, internalId: value }))} />
        <Input type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} />
        <Input type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} />
        <div className="flex flex-wrap gap-2 md:col-span-3 lg:col-span-7">
          <Button type="button" variant={filters.special === "without_client" ? "default" : "outline"} size="sm" onClick={() => setFilters((current) => ({ ...current, special: current.special === "without_client" ? "" : "without_client" }))}>Sin cliente</Button>
          <Button type="button" variant={filters.special === "recent" ? "default" : "outline"} size="sm" onClick={() => setFilters((current) => ({ ...current, special: current.special === "recent" ? "" : "recent" }))}>Recientes</Button>
          <Button type="button" variant={filters.special === "with_tasks" ? "default" : "outline"} size="sm" onClick={() => setFilters((current) => ({ ...current, special: current.special === "with_tasks" ? "" : "with_tasks" }))}>Con tareas</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => { setSearch(""); setFilters({ type: "", clientId: "", internalId: "", dateFrom: "", dateTo: "", special: "" }); }}>Limpiar filtros</Button>
        </div>
      </div>
      <InteractionTable interactions={filtered} emptyMessage="Sin resultados por filtros" />
    </div>
  );
}

function InteractionTable({ interactions, emptyMessage }: { interactions: InteractionListRow[]; emptyMessage: string }) {
  const [isPending, startTransition] = useTransition();
  const columns = useMemo<ColumnDef<InteractionListRow>[]>(
    () => [
      { header: "Titulo", cell: ({ row }) => <Link className="font-medium hover:underline" href={`/interactions/${row.original.id}`}>{row.original.title}</Link> },
      { header: "Tipo", cell: ({ row }) => <InteractionTypeBadge type={row.original.type} /> },
      { header: "Cliente/s", cell: ({ row }) => <BadgeList values={row.original.clients.map((item) => item.name)} empty="Sin cliente" /> },
      { header: "Fecha", cell: ({ row }) => formatInteractionDate(row.original.interaction_date, row.original.start_time, row.original.end_time) },
      { header: "Participantes internos", cell: ({ row }) => <BadgeList values={row.original.internalParticipants.map((item) => item.label)} empty="Sin internos" /> },
      { header: "Participantes externos", cell: ({ row }) => <BadgeList values={row.original.externalParticipants} empty="Sin externos" /> },
      { header: "Creada por", cell: ({ row }) => row.original.created_by_name || "-" },
      { header: "Actualizada", cell: ({ row }) => formatDate(row.original.updated_at) },
      {
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><Link href={`/interactions/${row.original.id}`}><Eye className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline" size="sm"><Link href={`/interactions/${row.original.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline" size="sm"><Link href={`/tasks/new?originType=interaction&originId=${row.original.id}&clientId=${row.original.clients[0]?.id || ""}`}><SquareCheckBig className="h-4 w-4" /></Link></Button>
            <Button variant="ghost" size="sm" disabled={isPending} onClick={() => {
              if (!window.confirm(`Archivar ${row.original.title}?`)) return;
              startTransition(async () => {
                await archiveInteractionRecord(row.original.id, row.original.clients.map((client) => client.id), "/interactions?toast=interaction_archived");
              });
            }}>Archivar</Button>
          </div>
        )
      }
    ],
    [isPending]
  );
  const table = useReactTable({ data: interactions, columns, getCoreRowModel: getCoreRowModel() });
  if (!interactions.length) return <EmptyState message={emptyMessage} />;

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50 text-left">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => <th key={header.id} className="px-4 py-3 font-medium">{flexRender(header.column.columnDef.header, header.getContext())}</th>)}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b align-top last:border-0">
              {row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BadgeList({ values, empty }: { values: string[]; empty: string }) {
  if (!values.length) return <span className="text-xs text-muted-foreground">{empty}</span>;
  return <div className="flex flex-wrap gap-1">{values.slice(0, 3).map((value) => <Badge key={value} variant="muted">{value}</Badge>)}{values.length > 3 ? <Badge variant="outline">+{values.length - 3}</Badge> : null}</div>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: (string | { label: string; value: string })[]; onChange: (value: string) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
      <option value="">{label}</option>
      {options.map((option) => {
        const item = typeof option === "string" ? { label: option, value: option } : option;
        return <option key={item.value} value={item.value}>{item.label}</option>;
      })}
    </select>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border bg-card p-8 text-center">
      <h2 className="text-base font-semibold">{message}</h2>
      <p className="mt-2 text-sm text-muted-foreground">Ajusta los filtros o registra una nueva interaccion.</p>
      <Button asChild className="mt-4"><Link href="/interactions/new">Nueva interaccion</Link></Button>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}
