"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { ExternalLink, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { archiveDocumentRecord } from "@/lib/actions/documents";
import type { DocumentEntityType } from "@/lib/validators/document";
import { DocumentTypeBadge, SourceTypeBadge } from "./document-badges";

export type DocumentListRow = {
  id: string;
  name: string;
  description: string | null;
  document_type: string;
  source_type: "upload" | "external_link";
  entity_type: DocumentEntityType;
  entity_id: string;
  entity_label: string;
  entity_href: string;
  uploader_name: string | null;
  created_at: string;
  updated_at: string;
  size: number | null;
  size_bytes: number | null;
  open_url: string | null;
  external_url: string | null;
};

export function DocumentWorkspace({ documents, users }: { documents: DocumentListRow[]; users: string[] }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ documentType: "", sourceType: "", entityType: "", user: "", from: "", to: "" });
  const filtered = useMemo(() => documents.filter((document) => {
    const needle = search.trim().toLowerCase();
    const haystack = [document.name, document.description].filter(Boolean).join(" ").toLowerCase();
    return (!needle || haystack.includes(needle))
      && (!filters.documentType || document.document_type === filters.documentType)
      && (!filters.sourceType || document.source_type === filters.sourceType)
      && (!filters.entityType || document.entity_type === filters.entityType)
      && (!filters.user || document.uploader_name === filters.user)
      && (!filters.from || document.created_at >= filters.from)
      && (!filters.to || document.created_at <= filters.to);
  }), [documents, filters, search]);

  if (!documents.length) return <EmptyState message="Sin documentos cargados" />;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-3 lg:grid-cols-7">
        <Input className="md:col-span-3 lg:col-span-2" placeholder="Buscar documentos..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <FilterSelect label="Tipo" value={filters.documentType} options={["contract", "report", "presentation", "spreadsheet", "note", "legal", "media", "image", "audio", "other"]} onChange={(documentType) => setFilters((f) => ({ ...f, documentType }))} />
        <FilterSelect label="Origen" value={filters.sourceType} options={[{ label: "Upload", value: "upload" }, { label: "Link externo", value: "external_link" }]} onChange={(sourceType) => setFilters((f) => ({ ...f, sourceType }))} />
        <FilterSelect label="Entidad" value={filters.entityType} options={["client", "contact", "task", "interaction", "report", "alert", "stakeholder"]} onChange={(entityType) => setFilters((f) => ({ ...f, entityType }))} />
        <FilterSelect label="Usuario" value={filters.user} options={users} onChange={(user) => setFilters((f) => ({ ...f, user }))} />
        <Input type="date" value={filters.from} onChange={(event) => setFilters((f) => ({ ...f, from: event.target.value }))} />
        <Input type="date" value={filters.to} onChange={(event) => setFilters((f) => ({ ...f, to: event.target.value }))} />
        <div className="md:col-span-3 lg:col-span-7">
          <Button type="button" size="sm" variant="outline" onClick={() => { setSearch(""); setFilters({ documentType: "", sourceType: "", entityType: "", user: "", from: "", to: "" }); }}>Limpiar filtros</Button>
        </div>
      </div>
      <DocumentTable documents={filtered} />
    </div>
  );
}

function DocumentTable({ documents }: { documents: DocumentListRow[] }) {
  const [isPending, startTransition] = useTransition();
  const columns = useMemo<ColumnDef<DocumentListRow>[]>(() => [
    { header: "Nombre", cell: ({ row }) => <Link href={`/documents/${row.original.id}`} className="font-medium hover:underline">{row.original.name}</Link> },
    { header: "Tipo", cell: ({ row }) => <DocumentTypeBadge type={row.original.document_type} /> },
    { header: "Origen", cell: ({ row }) => <SourceTypeBadge sourceType={row.original.source_type} /> },
    { header: "Entidad", cell: ({ row }) => <Badge variant="muted"><Link href={row.original.entity_href}>{row.original.entity_type}</Link></Badge> },
    { header: "Subido por", cell: ({ row }) => row.original.uploader_name || "-" },
    { header: "Fecha", cell: ({ row }) => formatDate(row.original.created_at) },
    { header: "Tamaño", cell: ({ row }) => formatSize(row.original.size || row.original.size_bytes) },
    { header: "Acciones", cell: ({ row }) => (
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline"><Link href={`/documents/${row.original.id}`}><Eye className="h-4 w-4" /></Link></Button>
        {row.original.open_url ? <Button asChild size="sm" variant="outline"><a href={row.original.open_url} target="_blank"><ExternalLink className="h-4 w-4" /></a></Button> : null}
        {row.original.source_type === "upload" && row.original.external_url ? <Button asChild size="sm" variant="outline"><a href={row.original.external_url} target="_blank">Link</a></Button> : null}
        <Button asChild size="sm" variant="outline"><Link href={`/documents/${row.original.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() => {
            if (!window.confirm(`Archivar ${row.original.name}?`)) return;
            startTransition(async () => archiveDocumentRecord(row.original.id, row.original.entity_type, row.original.entity_id, "/documents?toast=document_archived"));
          }}
        >
          Archivar
        </Button>
      </div>
    ) }
  ], [isPending]);
  const table = useReactTable({ data: documents, columns, getCoreRowModel: getCoreRowModel() });
  if (!documents.length) return <EmptyState message="Sin resultados por filtros" />;
  return <div className="overflow-x-auto rounded-lg border bg-card"><table className="w-full text-sm"><thead className="border-b bg-muted/50 text-left">{table.getHeaderGroups().map((hg) => <tr key={hg.id}>{hg.headers.map((h) => <th key={h.id} className="px-4 py-3 font-medium">{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map((row) => <tr key={row.id} className="border-b align-top last:border-0">{row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table></div>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: (string | { label: string; value: string })[]; onChange: (value: string) => void }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">{label}</option>{options.map((option) => { const item = typeof option === "string" ? { label: option, value: option } : option; return <option key={item.value} value={item.value}>{item.label}</option>; })}</select>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-lg border bg-card p-8 text-center"><h2 className="text-base font-semibold">{message}</h2><p className="mt-2 text-sm text-muted-foreground">Carga un archivo o agrega un link externo.</p><Button asChild className="mt-4"><Link href="/documents/new">Nuevo documento</Link></Button></div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function formatSize(value?: number | null) {
  if (!value) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
