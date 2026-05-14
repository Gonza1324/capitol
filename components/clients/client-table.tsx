"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable
} from "@tanstack/react-table";
import { Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { archiveClientRecord } from "@/lib/actions/clients";

export type ClientListRow = {
  id: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  status: string;
  client_type: string;
  start_date: string | null;
  updated_at: string;
  industries: { id: string; name: string }[];
  interests: { id: string; name: string; priority: string }[];
  assignments: { id: string; label: string; role: string | null }[];
};

type Filters = {
  status: string;
  clientType: string;
  industryId: string;
  interestId: string;
  assigneeId: string;
};

export function ClientTable({
  data,
  industries,
  interests,
  profiles
}: {
  data: ClientListRow[];
  industries: { id: string; name: string }[];
  interests: { id: string; name: string }[];
  profiles: { id: string; label: string }[];
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [filters, setFilters] = useState<Filters>({ status: "", clientType: "", industryId: "", interestId: "", assigneeId: "" });
  const [isPending, startTransition] = useTransition();

  const filteredData = useMemo(() => {
    const needle = globalFilter.trim().toLowerCase();
    return data.filter((client) => {
      const haystack = [
        client.name,
        client.legal_name,
        client.tax_id,
        ...client.industries.map((item) => item.name),
        ...client.interests.map((item) => item.name),
        ...client.assignments.map((item) => item.label)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!needle || haystack.includes(needle)) &&
        (!filters.status || client.status === filters.status) &&
        (!filters.clientType || client.client_type === filters.clientType) &&
        (!filters.industryId || client.industries.some((item) => item.id === filters.industryId)) &&
        (!filters.interestId || client.interests.some((item) => item.id === filters.interestId)) &&
        (!filters.assigneeId || client.assignments.some((item) => item.id === filters.assigneeId))
      );
    });
  }, [data, filters, globalFilter]);

  const columns = useMemo<ColumnDef<ClientListRow>[]>(
    () => [
      {
        header: "Nombre",
        accessorKey: "name",
        cell: ({ row }) => (
          <div>
            <Link href={`/clients/${row.original.id}`} className="font-medium hover:underline">
              {row.original.name}
            </Link>
            <p className="text-xs text-muted-foreground">{row.original.legal_name || row.original.tax_id || "Sin razon social"}</p>
          </div>
        )
      },
      {
        header: "Estado",
        accessorKey: "status",
        cell: ({ row }) => <Badge variant={row.original.status === "active" ? "success" : "secondary"}>{row.original.status}</Badge>
      },
      { header: "Tipo", accessorKey: "client_type" },
      {
        header: "Rubros",
        cell: ({ row }) => <BadgeList items={row.original.industries.map((item) => item.name)} empty="Sin rubros" />
      },
      {
        header: "Intereses principales",
        cell: ({ row }) => <BadgeList items={row.original.interests.filter((item) => item.priority === "high").map((item) => item.name)} empty="Sin high" />
      },
      {
        header: "Responsables",
        cell: ({ row }) => <BadgeList items={row.original.assignments.map((item) => item.label)} empty="Sin responsables" />
      },
      { header: "Inicio", accessorKey: "start_date", cell: ({ row }) => row.original.start_date || "-" },
      { header: "Actualizado", accessorKey: "updated_at", cell: ({ row }) => formatDate(row.original.updated_at) },
      {
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/clients/${row.original.id}`}><Eye className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/clients/${row.original.id}/edit`}><Pencil className="h-4 w-4" /></Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => {
                if (!window.confirm(`Archivar ${row.original.name}?`)) return;
                startTransition(async () => {
                  await archiveClientRecord(row.original.id);
                });
              }}
            >
              Archivar
            </Button>
          </div>
        )
      }
    ],
    [isPending]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  });

  if (!data.length) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <h2 className="text-lg font-semibold">Todavia no hay clientes</h2>
        <p className="mt-2 text-sm text-muted-foreground">Crea el primer cliente para empezar a centralizar informacion.</p>
        <Button asChild className="mt-4"><Link href="/clients/new">Nuevo cliente</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-3 lg:grid-cols-6">
        <Input
          className="md:col-span-3 lg:col-span-2"
          placeholder="Buscar por nombre, CUIT, rubro, interes..."
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
        />
        <FilterSelect value={filters.status} label="Estado" options={["active", "prospect", "paused", "former", "potential", "archived"]} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} />
        <FilterSelect value={filters.clientType} label="Tipo" options={["company", "chamber", "ngo", "person", "public_agency", "embassy", "association", "other"]} onChange={(value) => setFilters((current) => ({ ...current, clientType: value }))} />
        <FilterSelect value={filters.industryId} label="Rubro" options={industries.map((item) => ({ label: item.name, value: item.id }))} onChange={(value) => setFilters((current) => ({ ...current, industryId: value }))} />
        <FilterSelect value={filters.interestId} label="Interes" options={interests.map((item) => ({ label: item.name, value: item.id }))} onChange={(value) => setFilters((current) => ({ ...current, interestId: value }))} />
        <FilterSelect value={filters.assigneeId} label="Responsable" options={profiles.map((item) => ({ label: item.label, value: item.id }))} onChange={(value) => setFilters((current) => ({ ...current, assigneeId: value }))} />
        <Button type="button" variant="outline" onClick={() => { setGlobalFilter(""); setFilters({ status: "", clientType: "", industryId: "", interestId: "", assigneeId: "" }); }}>
          Limpiar filtros
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-medium">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b align-top last:border-0">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!filteredData.length ? (
          <div className="p-8 text-center">
            <h2 className="text-base font-semibold">No hay resultados</h2>
            <p className="mt-2 text-sm text-muted-foreground">Probá limpiar filtros o ajustar la busqueda.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BadgeList({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <span className="text-xs text-muted-foreground">{empty}</span>;
  return (
    <div className="flex max-w-56 flex-wrap gap-1">
      {items.slice(0, 3).map((item) => <Badge key={item} variant="muted">{item}</Badge>)}
      {items.length > 3 ? <Badge variant="outline">+{items.length - 3}</Badge> : null}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: (string | { label: string; value: string })[];
  onChange: (value: string) => void;
}) {
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}
