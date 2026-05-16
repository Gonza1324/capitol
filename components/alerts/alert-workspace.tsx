"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Archive, Eye, Pencil, SquareCheckBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { archiveAlertRecord } from "@/lib/actions/alerts";
import { AlertCategoryBadge, AlertUrgencyBadge } from "./alert-badges";

export type AlertListRow = {
  id: string;
  title: string;
  category: string;
  urgency: string;
  medium: string;
  description: string | null;
  content: string | null;
  notes: string | null;
  sent_at: string | null;
  responsible_name: string | null;
  updated_at: string;
  clients: { id: string; name: string }[];
  industries: { id: string; name: string }[];
  interests: { id: string; name: string }[];
};

export function AlertWorkspace({ alerts, clients, profiles, industries, interests }: { alerts: AlertListRow[]; clients: { id: string; name: string }[]; profiles: { id: string; label: string }[]; industries: { id: string; name: string }[]; interests: { id: string; name: string }[] }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ category: "", urgency: "", medium: "", clientId: "", industryId: "", interestId: "", responsibleId: "", from: "", to: "", special: "" });
  const filtered = useMemo(() => alerts.filter((alert) => {
    const needle = search.trim().toLowerCase();
    const haystack = [alert.title, alert.description, alert.content, alert.notes].filter(Boolean).join(" ").toLowerCase();
    return (!needle || haystack.includes(needle))
      && (!filters.category || alert.category === filters.category)
      && (!filters.urgency || alert.urgency === filters.urgency)
      && (!filters.medium || alert.medium === filters.medium)
      && (!filters.clientId || alert.clients.some((client) => client.id === filters.clientId))
      && (!filters.industryId || alert.industries.some((industry) => industry.id === filters.industryId))
      && (!filters.interestId || alert.interests.some((interest) => interest.id === filters.interestId))
      && (!filters.responsibleId || alert.responsible_name === profiles.find((p) => p.id === filters.responsibleId)?.label)
      && (!filters.from || (alert.sent_at || "") >= filters.from)
      && (!filters.to || (alert.sent_at || "") <= filters.to)
      && (filters.special !== "critical" || alert.urgency === "critical");
  }), [alerts, filters, profiles, search]);

  if (!alerts.length) return <EmptyState message="Sin alertas cargadas" />;
  return <div className="space-y-4">
    <div className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-3 lg:grid-cols-7">
      <Input className="md:col-span-3 lg:col-span-2" placeholder="Buscar alertas..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <FilterSelect label="Categoria" value={filters.category} options={["legislative", "executive", "judicial", "regulatory", "media", "provincial", "municipal", "international", "other"]} onChange={(category) => setFilters((f) => ({ ...f, category }))} />
      <FilterSelect label="Urgencia" value={filters.urgency} options={["low", "medium", "high", "critical"]} onChange={(urgency) => setFilters((f) => ({ ...f, urgency }))} />
      <FilterSelect label="Canal" value={filters.medium} options={["email", "whatsapp", "pdf", "other"]} onChange={(medium) => setFilters((f) => ({ ...f, medium }))} />
      <FilterSelect label="Cliente" value={filters.clientId} options={clients.map((c) => ({ label: c.name, value: c.id }))} onChange={(clientId) => setFilters((f) => ({ ...f, clientId }))} />
      <FilterSelect label="Rubro" value={filters.industryId} options={industries.map((i) => ({ label: i.name, value: i.id }))} onChange={(industryId) => setFilters((f) => ({ ...f, industryId }))} />
      <FilterSelect label="Issue" value={filters.interestId} options={interests.map((i) => ({ label: i.name, value: i.id }))} onChange={(interestId) => setFilters((f) => ({ ...f, interestId }))} />
      <FilterSelect label="Responsable" value={filters.responsibleId} options={profiles.map((p) => ({ label: p.label, value: p.id }))} onChange={(responsibleId) => setFilters((f) => ({ ...f, responsibleId }))} />
      <Input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
      <Input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
      <div className="flex gap-2 md:col-span-3 lg:col-span-7"><Button type="button" size="sm" variant={filters.special === "critical" ? "default" : "outline"} onClick={() => setFilters((f) => ({ ...f, special: f.special === "critical" ? "" : "critical" }))}>Criticas</Button><Button type="button" size="sm" variant="outline" onClick={() => { setSearch(""); setFilters({ category: "", urgency: "", medium: "", clientId: "", industryId: "", interestId: "", responsibleId: "", from: "", to: "", special: "" }); }}>Limpiar</Button></div>
    </div>
    <AlertTable alerts={filtered} />
  </div>;
}

function AlertTable({ alerts }: { alerts: AlertListRow[] }) {
  const [isPending, startTransition] = useTransition();
  const columns = useMemo<ColumnDef<AlertListRow>[]>(() => [
    { header: "Titulo", cell: ({ row }) => <Link href={`/alerts/${row.original.id}`} className="font-medium hover:underline">{row.original.title}</Link> },
    { header: "Categoria", cell: ({ row }) => <AlertCategoryBadge category={row.original.category} /> },
    { header: "Urgencia", cell: ({ row }) => <AlertUrgencyBadge urgency={row.original.urgency} /> },
    { header: "Canal", accessorKey: "medium" },
    { header: "Cliente/s", cell: ({ row }) => <BadgeList values={row.original.clients.map((c) => c.name)} empty="Sin cliente" /> },
    { header: "Rubros", cell: ({ row }) => <BadgeList values={row.original.industries.map((i) => i.name)} empty="-" /> },
    { header: "Issues", cell: ({ row }) => <BadgeList values={row.original.interests.map((i) => i.name)} empty="-" /> },
    { header: "Responsable", cell: ({ row }) => row.original.responsible_name || "-" },
    { header: "Envio", cell: ({ row }) => formatDate(row.original.sent_at) },
    { header: "Actualizado", cell: ({ row }) => formatDate(row.original.updated_at) },
    { header: "Acciones", cell: ({ row }) => <div className="flex gap-2"><Button asChild size="sm" variant="outline"><Link href={`/alerts/${row.original.id}`}><Eye className="h-4 w-4" /></Link></Button><Button asChild size="sm" variant="outline"><Link href={`/alerts/${row.original.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button><Button asChild size="sm" variant="outline"><Link href={`/tasks/new?originType=alert&originId=${row.original.id}&clientId=${row.original.clients[0]?.id || ""}`}><SquareCheckBig className="h-4 w-4" /></Link></Button><Button size="icon" variant="outline" title="Archivar" aria-label="Archivar" disabled={isPending} onClick={() => { if (!window.confirm(`Archivar ${row.original.title}?`)) return; startTransition(async () => archiveAlertRecord(row.original.id, row.original.clients.map((c) => c.id), "/alerts?toast=alert_archived")); }}><Archive className="h-4 w-4" /></Button></div> }
  ], [isPending]);
  const table = useReactTable({ data: alerts, columns, getCoreRowModel: getCoreRowModel() });
  if (!alerts.length) return <EmptyState message="Sin resultados por filtros" />;
  return <div className="overflow-x-auto rounded-lg border bg-card"><table className="w-full text-sm"><thead className="border-b bg-muted/50 text-left">{table.getHeaderGroups().map((hg) => <tr key={hg.id}>{hg.headers.map((h) => <th key={h.id} className="px-4 py-3 font-medium">{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map((row) => <tr key={row.id} className="border-b align-top last:border-0">{row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table></div>;
}

function BadgeList({ values, empty }: { values: string[]; empty: string }) { return values.length ? <div className="flex flex-wrap gap-1">{values.slice(0, 3).map((v) => <Badge key={v} variant="muted">{v}</Badge>)}</div> : <span className="text-xs text-muted-foreground">{empty}</span>; }
function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: (string | { label: string; value: string })[]; onChange: (value: string) => void }) { return <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">{label}</option>{options.map((o) => { const item = typeof o === "string" ? { label: o, value: o } : o; return <option key={item.value} value={item.value}>{item.label}</option>; })}</select>; }
function EmptyState({ message }: { message: string }) { return <div className="rounded-lg border bg-card p-8 text-center"><h2 className="text-base font-semibold">{message}</h2><p className="mt-2 text-sm text-muted-foreground">Ajusta filtros o registra una nueva alerta.</p><Button asChild className="mt-4"><Link href="/alerts/new">Nueva alerta</Link></Button></div>; }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)) : "-"; }
