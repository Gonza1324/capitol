"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Archive, Cloud, MoreVertical, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveClientRecord } from "@/lib/actions/clients";

export type ClientListRow = {
  id: string;
  name: string;
  drive_url: string | null;
};

export function ClientTable({ data }: { data: ClientListRow[] }) {
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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {data.map((client) => <ClientCard key={client.id} client={client} />)}
    </div>
  );
}

function ClientCard({ client }: { client: ClientListRow }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="flex min-h-20 items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/60">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <span className="text-sm font-semibold">{client.name.charAt(0).toUpperCase()}</span>
      </div>
      <Link href={`/clients/${client.id}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:underline">
        {client.name}
      </Link>
      <div ref={menuRef} className="relative">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Opciones de ${client.name}`}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
        {open ? (
          <div className="absolute right-0 top-10 z-20 w-44 rounded-md border bg-card p-1 text-sm shadow-lg">
            <MenuLink href={`/clients/${client.id}/edit`} icon={<Pencil className="h-4 w-4" />} label="Editar" />
            {client.drive_url ? (
              <MenuAnchor href={client.drive_url} icon={<Cloud className="h-4 w-4" />} label="Abrir Drive" />
            ) : null}
            <button
              type="button"
              disabled={isPending}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-destructive hover:bg-muted disabled:opacity-60"
              onClick={() => {
                if (!window.confirm(`Archivar ${client.name}?`)) return;
                startTransition(async () => {
                  await archiveClientRecord(client.id);
                });
              }}
            >
              <Archive className="h-4 w-4" />
              Archivar
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MenuLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-sm px-3 py-2 hover:bg-muted">
      {icon}
      {label}
    </Link>
  );
}

function MenuAnchor({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-sm px-3 py-2 hover:bg-muted">
      {icon}
      {label}
    </a>
  );
}
