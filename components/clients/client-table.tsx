"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";
import { Archive, ArrowDown, ArrowUp, ArrowUpDown, Cloud, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { archiveClientRecord } from "@/lib/actions/clients";

export type ClientListRow = {
  id: string;
  name: string;
  status: string;
  drive_url: string | null;
  updated_at: string;
  industries: { id: string; name: string }[];
  interests: { id: string; name: string; priority: string }[];
  assignments: { id: string; label: string; role: string | null }[];
};

export function ClientTable({
  data
}: {
  data: ClientListRow[];
  industries: { id: string; name: string }[];
  interests: { id: string; name: string }[];
  profiles: { id: string; label: string }[];
}) {
  const [industrySort, setIndustrySort] = useState<"asc" | "desc" | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortedData = useMemo(() => sortClientsByIndustry(data, industrySort), [data, industrySort]);

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
          </div>
        )
      },
      {
        header: "Estado",
        accessorKey: "status",
        cell: ({ row }) => <Badge variant={row.original.status === "active" ? "success" : "secondary"}>{row.original.status}</Badge>
      },
      {
        id: "industries",
        header: () => (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-sm font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setIndustrySort((current) => current === "asc" ? "desc" : "asc")}
          >
            <span>Rubros</span>
            {industrySort === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : industrySort === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5" />}
          </button>
        ),
        cell: ({ row }) => <BadgeList items={row.original.industries.map((item) => item.name)} empty="Sin rubros" />
      },
      {
        header: "Issues principales",
        cell: ({ row }) => <BadgeList items={row.original.interests.filter((item) => item.priority === "high").map((item) => item.name)} empty="Sin high" />
      },
      {
        header: "Responsables",
        cell: ({ row }) => <BadgeList items={row.original.assignments.map((item) => item.label)} empty="Sin responsables" />
      },
      {
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/clients/${row.original.id}/edit`}><Pencil className="h-4 w-4" /></Link>
            </Button>
            {row.original.drive_url ? (
              <Button asChild variant="outline" size="icon" title="Abrir Drive" aria-label="Abrir Drive">
                <a href={row.original.drive_url} target="_blank" rel="noreferrer"><Cloud className="h-4 w-4" /></a>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Archivar"
              aria-label="Archivar"
              disabled={isPending}
              onClick={() => {
                if (!window.confirm(`Archivar ${row.original.name}?`)) return;
                startTransition(async () => {
                  await archiveClientRecord(row.original.id);
                });
              }}
            >
              <Archive className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    ],
    [industrySort, isPending]
  );

  const table = useReactTable({
    data: sortedData,
    columns,
    getCoreRowModel: getCoreRowModel()
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

function sortClientsByIndustry(data: ClientListRow[], direction: "asc" | "desc" | null) {
  if (!direction) return data;
  const multiplier = direction === "asc" ? 1 : -1;
  return [...data].sort((a, b) => {
    const aIndustry = industrySortValue(a);
    const bIndustry = industrySortValue(b);
    const industryDiff = aIndustry.localeCompare(bIndustry, "es", { sensitivity: "base" });
    if (industryDiff) return industryDiff * multiplier;
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });
}

function industrySortValue(client: ClientListRow) {
  return client.industries.map((item) => item.name).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }))[0] || "ZZZ Sin rubro";
}
