"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Archive, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { archiveStakeholderRecord } from "@/lib/actions/stakeholders";
import { InfluenceBadge, SensitivityBadge, StakeholderTypeBadge, StanceBadge } from "./stakeholder-badges";

export type StakeholderListRow = {
  id: string;
  full_name: string;
  type: string;
  organization: string | null;
  title: string | null;
  email: string | null;
  jurisdiction: string | null;
  influence_area: string | null;
  influence_level: string | null;
  stance: string;
  sensitivity_level: string | null;
  notes: string | null;
  is_active: boolean;
  updated_at: string;
  clients: { id: string; name: string }[];
};

export function StakeholderWorkspace({ stakeholders, clients }: { stakeholders: StakeholderListRow[]; clients: { id: string; name: string }[] }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ type: "", jurisdiction: "", influenceArea: "", influence: "", stance: "", sensitivity: "", clientId: "", active: "" });
  const filtered = useMemo(() => stakeholders.filter((stakeholder) => {
    const needle = search.trim().toLowerCase();
    const haystack = [stakeholder.full_name, stakeholder.organization, stakeholder.title, stakeholder.email, stakeholder.notes].filter(Boolean).join(" ").toLowerCase();
    return (!needle || haystack.includes(needle))
      && (!filters.type || stakeholder.type === filters.type)
      && (!filters.jurisdiction || (stakeholder.jurisdiction || "").toLowerCase().includes(filters.jurisdiction.toLowerCase()))
      && (!filters.influenceArea || (stakeholder.influence_area || "").toLowerCase().includes(filters.influenceArea.toLowerCase()))
      && (!filters.influence || stakeholder.influence_level === filters.influence)
      && (!filters.stance || stakeholder.stance === filters.stance)
      && (!filters.sensitivity || stakeholder.sensitivity_level === filters.sensitivity)
      && (!filters.clientId || stakeholder.clients.some((client) => client.id === filters.clientId))
      && (!filters.active || String(stakeholder.is_active) === filters.active);
  }), [filters, search, stakeholders]);

  if (!stakeholders.length) return <EmptyState message="Sin stakeholders cargados" />;
  return <div className="space-y-4"><div className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-3 lg:grid-cols-8"><Input className="md:col-span-3 lg:col-span-2" placeholder="Buscar stakeholders..." value={search} onChange={(e) => setSearch(e.target.value)} /><FilterSelect label="Tipo" value={filters.type} options={["official", "legislator", "advisor", "chamber", "journalist", "union", "ngo", "business_person", "regulator", "provincial_referent", "other"]} onChange={(type) => setFilters((f) => ({ ...f, type }))} /><Input placeholder="Jurisdiccion" value={filters.jurisdiction} onChange={(e) => setFilters((f) => ({ ...f, jurisdiction: e.target.value }))} /><Input placeholder="Area influencia" value={filters.influenceArea} onChange={(e) => setFilters((f) => ({ ...f, influenceArea: e.target.value }))} /><FilterSelect label="Influencia" value={filters.influence} options={["low", "medium", "high", "critical"]} onChange={(influence) => setFilters((f) => ({ ...f, influence }))} /><FilterSelect label="Postura" value={filters.stance} options={["ally", "neutral", "opponent", "unknown"]} onChange={(stance) => setFilters((f) => ({ ...f, stance }))} /><FilterSelect label="Sensibilidad" value={filters.sensitivity} options={["low", "medium", "high", "restricted"]} onChange={(sensitivity) => setFilters((f) => ({ ...f, sensitivity }))} /><FilterSelect label="Cliente" value={filters.clientId} options={clients.map((c) => ({ label: c.name, value: c.id }))} onChange={(clientId) => setFilters((f) => ({ ...f, clientId }))} /><FilterSelect label="Estado" value={filters.active} options={[{ label: "Activo", value: "true" }, { label: "Inactivo", value: "false" }]} onChange={(active) => setFilters((f) => ({ ...f, active }))} /><Button type="button" variant="outline" onClick={() => { setSearch(""); setFilters({ type: "", jurisdiction: "", influenceArea: "", influence: "", stance: "", sensitivity: "", clientId: "", active: "" }); }}>Limpiar</Button></div><StakeholderTable stakeholders={filtered} /></div>;
}

function StakeholderTable({ stakeholders }: { stakeholders: StakeholderListRow[] }) {
  const [isPending, startTransition] = useTransition();
  const columns = useMemo<ColumnDef<StakeholderListRow>[]>(() => [
    { header: "Nombre", cell: ({ row }) => <div><Link href={`/stakeholders/${row.original.id}`} className="font-medium hover:underline">{row.original.full_name}</Link><p className="text-xs text-muted-foreground">{row.original.email || "-"}</p></div> },
    { header: "Tipo", cell: ({ row }) => <StakeholderTypeBadge type={row.original.type} /> },
    { header: "Organizacion", accessorKey: "organization" },
    { header: "Cargo", accessorKey: "title" },
    { header: "Jurisdiccion", accessorKey: "jurisdiction" },
    { header: "Area", accessorKey: "influence_area" },
    { header: "Influencia", cell: ({ row }) => <InfluenceBadge level={row.original.influence_level} /> },
    { header: "Postura", cell: ({ row }) => <StanceBadge stance={row.original.stance} /> },
    { header: "Sensibilidad", cell: ({ row }) => <SensitivityBadge level={row.original.sensitivity_level} /> },
    { header: "Clientes", cell: ({ row }) => <BadgeList values={row.original.clients.map((c) => c.name)} empty="-" /> },
    { header: "Estado", cell: ({ row }) => <Badge variant={row.original.is_active ? "success" : "muted"}>{row.original.is_active ? "activo" : "inactivo"}</Badge> },
    { header: "Actualizado", cell: ({ row }) => formatDate(row.original.updated_at) },
    { header: "Acciones", cell: ({ row }) => <div className="flex gap-2"><Button asChild size="sm" variant="outline"><Link href={`/stakeholders/${row.original.id}`}><Eye className="h-4 w-4" /></Link></Button><Button asChild size="sm" variant="outline"><Link href={`/stakeholders/${row.original.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button><Button asChild size="sm" variant="outline"><Link href={`/interactions/new?stakeholderId=${row.original.id}`}>Interaccion</Link></Button><Button size="icon" variant="outline" title="Archivar" aria-label="Archivar" disabled={isPending} onClick={() => { if (!window.confirm(`Archivar ${row.original.full_name}?`)) return; startTransition(async () => archiveStakeholderRecord(row.original.id, row.original.clients.map((c) => c.id), "/stakeholders?toast=stakeholder_archived")); }}><Archive className="h-4 w-4" /></Button></div> }
  ], [isPending]);
  const table = useReactTable({ data: stakeholders, columns, getCoreRowModel: getCoreRowModel() });
  if (!stakeholders.length) return <EmptyState message="Sin resultados por filtros" />;
  return <div className="overflow-x-auto rounded-lg border bg-card"><table className="w-full text-sm"><thead className="border-b bg-muted/50 text-left">{table.getHeaderGroups().map((hg) => <tr key={hg.id}>{hg.headers.map((h) => <th key={h.id} className="px-4 py-3 font-medium">{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map((row) => <tr key={row.id} className="border-b align-top last:border-0">{row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table></div>;
}

function BadgeList({ values, empty }: { values: string[]; empty: string }) { return values.length ? <div className="flex flex-wrap gap-1">{values.slice(0, 3).map((v) => <Badge key={v} variant="muted">{v}</Badge>)}</div> : <span className="text-xs text-muted-foreground">{empty}</span>; }
function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: (string | { label: string; value: string })[]; onChange: (value: string) => void }) { return <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">{label}</option>{options.map((o) => { const item = typeof o === "string" ? { label: o, value: o } : o; return <option key={item.value} value={item.value}>{item.label}</option>; })}</select>; }
function EmptyState({ message }: { message: string }) { return <div className="rounded-lg border bg-card p-8 text-center"><h2 className="text-base font-semibold">{message}</h2><p className="mt-2 text-sm text-muted-foreground">Ajusta filtros o registra un nuevo stakeholder.</p><Button asChild className="mt-4"><Link href="/stakeholders/new">Nuevo stakeholder</Link></Button></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)); }
