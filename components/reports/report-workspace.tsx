"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Archive, Eye, Pencil, SquareCheckBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { archiveReportRecord, changeReportStatus } from "@/lib/actions/reports";
import { ReportStatusBadge, ReportTypeBadge } from "./report-badges";

export type ReportListRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  topic: string | null;
  description: string | null;
  notes: string | null;
  sent_at: string | null;
  approval_required: boolean;
  approved_by: string | null;
  approved_at: string | null;
  responsible_name: string | null;
  updated_at: string;
  clients: { id: string; name: string }[];
};

export function ReportWorkspace({ reports, clients, profiles }: { reports: ReportListRow[]; clients: { id: string; name: string }[]; profiles: { id: string; label: string }[] }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ type: "", status: "", clientId: "", responsibleId: "", from: "", to: "", special: "" });
  const filtered = useMemo(() => reports.filter((report) => {
    const needle = search.trim().toLowerCase();
    const haystack = [report.title, report.topic, report.description, report.notes].filter(Boolean).join(" ").toLowerCase();
    return (!needle || haystack.includes(needle))
      && (!filters.type || report.type === filters.type)
      && (!filters.status || report.status === filters.status)
      && (!filters.clientId || report.clients.some((client) => client.id === filters.clientId))
      && (!filters.responsibleId || report.responsible_name === profiles.find((p) => p.id === filters.responsibleId)?.label)
      && (!filters.from || (report.sent_at || "") >= filters.from)
      && (!filters.to || (report.sent_at || "") <= filters.to)
      && (filters.special !== "approval" || report.approval_required)
      && (filters.special !== "sent" || report.status === "sent")
      && (filters.special !== "review" || report.status === "in_review")
      && (filters.special !== "archived" || report.status === "archived");
  }), [filters, profiles, reports, search]);

  if (!reports.length) return <EmptyState message="Sin reportes cargados" />;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-3 lg:grid-cols-7">
        <Input className="md:col-span-3 lg:col-span-2" placeholder="Buscar reportes..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <FilterSelect label="Tipo" value={filters.type} options={["weekly_report", "monthly_report", "political_context", "legislative_report", "regulatory_report", "media_report", "custom_report", "executive_memo", "urgent_alert", "official_gazette_daily_changes"]} onChange={(type) => setFilters((f) => ({ ...f, type }))} />
        <FilterSelect label="Estado" value={filters.status} options={["draft", "in_review", "approved", "sent", "archived"]} onChange={(status) => setFilters((f) => ({ ...f, status }))} />
        <FilterSelect label="Cliente" value={filters.clientId} options={clients.map((client) => ({ label: client.name, value: client.id }))} onChange={(clientId) => setFilters((f) => ({ ...f, clientId }))} />
        <FilterSelect label="Responsable" value={filters.responsibleId} options={profiles.map((profile) => ({ label: profile.label, value: profile.id }))} onChange={(responsibleId) => setFilters((f) => ({ ...f, responsibleId }))} />
        <Input type="date" value={filters.from} onChange={(event) => setFilters((f) => ({ ...f, from: event.target.value }))} />
        <Input type="date" value={filters.to} onChange={(event) => setFilters((f) => ({ ...f, to: event.target.value }))} />
        <div className="flex flex-wrap gap-2 md:col-span-3 lg:col-span-7">
          {[
            ["approval", "Requiere aprobacion"],
            ["sent", "Enviados"],
            ["review", "En revision"],
            ["archived", "Archivados"]
          ].map(([value, label]) => <Button key={value} type="button" size="sm" variant={filters.special === value ? "default" : "outline"} onClick={() => setFilters((f) => ({ ...f, special: f.special === value ? "" : value }))}>{label}</Button>)}
          <Button type="button" size="sm" variant="outline" onClick={() => { setSearch(""); setFilters({ type: "", status: "", clientId: "", responsibleId: "", from: "", to: "", special: "" }); }}>Limpiar</Button>
        </div>
      </div>
      <ReportTable reports={filtered} />
    </div>
  );
}

function ReportTable({ reports }: { reports: ReportListRow[] }) {
  const [isPending, startTransition] = useTransition();
  const columns = useMemo<ColumnDef<ReportListRow>[]>(() => [
    { header: "Titulo", cell: ({ row }) => <Link className="font-medium hover:underline" href={`/reports/${row.original.id}`}>{row.original.title}</Link> },
    { header: "Tipo", cell: ({ row }) => <ReportTypeBadge type={row.original.type} /> },
    { header: "Estado", cell: ({ row }) => <ReportStatusBadge status={row.original.status} /> },
    { header: "Cliente/s", cell: ({ row }) => <BadgeList values={row.original.clients.map((c) => c.name)} empty="Sin cliente" /> },
    { header: "Tema", cell: ({ row }) => row.original.topic || "-" },
    { header: "Responsable", cell: ({ row }) => row.original.responsible_name || "-" },
    { header: "Envio", cell: ({ row }) => formatDate(row.original.sent_at) },
    { header: "Aprobacion", cell: ({ row }) => row.original.approval_required ? <Badge variant={row.original.approved_at ? "success" : "warning"}>{row.original.approved_at ? "aprobado" : "pendiente"}</Badge> : "-" },
    { header: "Actualizado", cell: ({ row }) => formatDate(row.original.updated_at) },
    { header: "Acciones", cell: ({ row }) => <div className="flex gap-2">
      <Button asChild size="sm" variant="outline"><Link href={`/reports/${row.original.id}`}><Eye className="h-4 w-4" /></Link></Button>
      <Button asChild size="sm" variant="outline"><Link href={`/reports/${row.original.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button>
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => startTransition(async () => changeReportStatus(row.original.id, "sent", row.original.clients.map((c) => c.id), "/reports?toast=report_sent"))}>Enviado</Button>
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => startTransition(async () => changeReportStatus(row.original.id, "approved", row.original.clients.map((c) => c.id), "/reports?toast=report_approved"))}>Aprobar</Button>
      <Button asChild size="sm" variant="outline"><Link href={`/tasks/new?originType=report&originId=${row.original.id}&clientId=${row.original.clients[0]?.id || ""}`}><SquareCheckBig className="h-4 w-4" /></Link></Button>
      <Button size="icon" variant="outline" title="Archivar" aria-label="Archivar" disabled={isPending} onClick={() => { if (!window.confirm(`Archivar ${row.original.title}?`)) return; startTransition(async () => archiveReportRecord(row.original.id, row.original.clients.map((c) => c.id), "/reports?toast=report_archived")); }}><Archive className="h-4 w-4" /></Button>
    </div> }
  ], [isPending]);
  const table = useReactTable({ data: reports, columns, getCoreRowModel: getCoreRowModel() });
  if (!reports.length) return <EmptyState message="Sin resultados por filtros" />;
  return <div className="overflow-x-auto rounded-lg border bg-card"><table className="w-full text-sm"><thead className="border-b bg-muted/50 text-left">{table.getHeaderGroups().map((hg) => <tr key={hg.id}>{hg.headers.map((h) => <th key={h.id} className="px-4 py-3 font-medium">{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map((row) => <tr key={row.id} className="border-b align-top last:border-0">{row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table></div>;
}

function BadgeList({ values, empty }: { values: string[]; empty: string }) { return values.length ? <div className="flex flex-wrap gap-1">{values.slice(0, 3).map((v) => <Badge key={v} variant="muted">{v}</Badge>)}</div> : <span className="text-xs text-muted-foreground">{empty}</span>; }
function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: (string | { label: string; value: string })[]; onChange: (value: string) => void }) { return <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">{label}</option>{options.map((o) => { const item = typeof o === "string" ? { label: o, value: o } : o; return <option key={item.value} value={item.value}>{item.label}</option>; })}</select>; }
function EmptyState({ message }: { message: string }) { return <div className="rounded-lg border bg-card p-8 text-center"><h2 className="text-base font-semibold">{message}</h2><p className="mt-2 text-sm text-muted-foreground">Ajusta filtros o registra un nuevo reporte.</p><Button asChild className="mt-4"><Link href="/reports/new">Nuevo reporte</Link></Button></div>; }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)) : "-"; }
