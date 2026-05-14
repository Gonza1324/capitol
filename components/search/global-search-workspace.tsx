"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSavedSearch, deleteSavedSearch, renameSavedSearch } from "@/lib/actions/search";
import { filtersToQuery, searchEntityTypes, type SavedSearch, type SearchData, type SearchFilters, type SearchResult } from "@/lib/data/search-shared";

const entityLabels: Record<string, string> = {
  all: "Todos",
  client: "Clientes",
  contact: "Contactos",
  task: "Tareas",
  interaction: "Interacciones",
  report: "Reportes",
  alert: "Alertas",
  stakeholder: "Stakeholders",
  document: "Documentos"
};

const resultTypeLabels: Record<SearchResult["entity"], string> = {
  client: "Cliente",
  contact: "Contacto",
  task: "Tarea",
  interaction: "Interaccion",
  report: "Reporte",
  alert: "Alerta",
  stakeholder: "Stakeholder",
  document: "Documento"
};

export function GlobalSearchWorkspace({ data }: { data: SearchData }) {
  const [saveName, setSaveName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const filters = data.filters;

  function onSave() {
    setSaveError(null);
    const formData = new FormData();
    formData.set("name", saveName);
    appendFilters(formData, filters);
    startTransition(async () => {
      try {
        await createSavedSearch(formData);
      } catch (error) {
        const digest = typeof error === "object" && error && "digest" in error ? String(error.digest) : "";
        if (digest.startsWith("NEXT_REDIRECT")) throw error;
        setSaveError(error instanceof Error ? error.message : "No pudimos guardar la busqueda.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Buscar en Capitol Hub</CardTitle>
          <CardDescription>Clientes, contactos, tareas, interacciones, reportes, alertas, stakeholders y documentos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action="/search" className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <div className="md:col-span-3 xl:col-span-2">
              <Label className="sr-only">Texto libre</Label>
              <Input name="q" defaultValue={filters.q} placeholder="Buscar por nombre, titulo, email, notas..." />
            </div>
            <FilterSelect name="clientId" label="Cliente" value={filters.clientId} options={data.options.clients} />
            <FilterSelect name="userId" label="Responsable / usuario" value={filters.userId} options={data.options.users} />
            <Input name="dateFrom" type="date" defaultValue={filters.dateFrom} />
            <Input name="dateTo" type="date" defaultValue={filters.dateTo} />
            <FilterSelect name="status" label="Estado" value={filters.status} options={["active", "prospect", "paused", "former", "potential", "archived", "pending", "in_progress", "in_review", "completed", "cancelled", "draft", "approved", "sent"]} />
            <FilterSelect name="priority" label="Prioridad" value={filters.priority} options={["low", "medium", "high", "urgent"]} />
            <FilterSelect name="urgency" label="Urgencia" value={filters.urgency} options={["low", "medium", "high", "critical"]} />
            <FilterSelect name="category" label="Categoria" value={filters.category} options={["legislative", "executive", "judicial", "regulatory", "media", "provincial", "municipal", "international", "other"]} />
            <FilterSelect name="industryId" label="Rubro" value={filters.industryId} options={data.options.industries} />
            <FilterSelect name="interestId" label="Interes" value={filters.interestId} options={data.options.interests} />
            <input type="hidden" name="entity" value={filters.entity} />
            <div className="flex flex-wrap gap-2 md:col-span-3 xl:col-span-6">
              <Button type="submit"><Search className="h-4 w-4" /> Buscar</Button>
              <Button asChild type="button" variant="outline"><Link href="/search">Limpiar filtros</Link></Button>
            </div>
          </form>
          <div className="flex flex-wrap gap-2">
            {searchEntityTypes.map((entity) => {
              const next = filtersToQuery({ ...filters, entity });
              return (
                <Button key={entity} asChild size="sm" variant={filters.entity === entity ? "default" : "outline"}>
                  <Link href={next ? `/search?${next}` : "/search"}>{entityLabels[entity]}</Link>
                </Button>
              );
            })}
          </div>
          <div className="rounded-md border p-3">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <Input value={saveName} onChange={(event) => setSaveName(event.target.value)} placeholder="Nombre de busqueda guardada" />
              <Button type="button" disabled={isPending} onClick={onSave}>{isPending ? "Guardando..." : "Guardar busqueda"}</Button>
            </div>
            {saveError ? <p className="mt-2 text-xs text-destructive">{saveError}</p> : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{data.hasActiveSearch ? `${data.results.length} resultados` : "Resultados"}</h2>
          </div>
          {!data.hasActiveSearch ? <EmptyState title="Usa el buscador para empezar" description="Ingresá texto o aplicá filtros para consultar la base completa de Capitol Hub." /> : null}
          {data.hasActiveSearch && !data.results.length ? <EmptyState title="Sin resultados" description="Probá limpiar filtros o buscar con menos términos." /> : null}
          {data.results.length ? <ResultList results={data.results} /> : null}
        </section>
        <SavedSearches searches={data.savedSearches} />
      </div>
    </div>
  );
}

function ResultList({ results }: { results: SearchResult[] }) {
  return (
    <div className="space-y-3">
      {results.map((result) => (
        <Link key={`${result.entity}-${result.id}`} href={result.href} className="block rounded-lg border bg-card p-4 hover:bg-accent/50">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{resultTypeLabels[result.entity]}</Badge>
                {result.badges.slice(0, 4).map((badge) => <Badge key={badge} variant="muted">{badge}</Badge>)}
              </div>
              <h3 className="mt-2 text-base font-semibold">{result.title}</h3>
              {result.subtitle ? <p className="mt-1 text-sm text-muted-foreground">{result.subtitle}</p> : null}
              {result.description ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{result.description}</p> : null}
            </div>
            {result.date ? <p className="shrink-0 text-xs text-muted-foreground">{formatDate(result.date)}</p> : null}
          </div>
        </Link>
      ))}
    </div>
  );
}

function SavedSearches({ searches }: { searches: SavedSearch[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis busquedas</CardTitle>
        <CardDescription>Filtros guardados por tu usuario.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {searches.length ? searches.map((search) => (
          <div key={search.id} className="rounded-md border p-3">
            <Link className="text-sm font-medium hover:underline" href={`/search?${filtersToQuery(search.filters)}`}>{search.name}</Link>
            <p className="mt-1 text-xs text-muted-foreground">{formatDate(search.updated_at)}</p>
            <form action={renameSavedSearch.bind(null, search.id)} className="mt-3 flex gap-2">
              <Input name="name" defaultValue={search.name} className="h-9" />
              <Button size="sm" variant="outline">Renombrar</Button>
            </form>
            <form action={deleteSavedSearch.bind(null, search.id)} className="mt-2">
              <Button size="sm" variant="ghost"><Trash2 className="h-4 w-4" /> Eliminar</Button>
            </form>
          </div>
        )) : <p className="text-sm text-muted-foreground">Todavia no guardaste busquedas.</p>}
      </CardContent>
    </Card>
  );
}

function FilterSelect({ name, label, value, options }: { name: string; label: string; value: string; options: (string | { id: string; label: string })[] }) {
  return (
    <select name={name} defaultValue={value} className="h-10 rounded-md border bg-background px-3 text-sm">
      <option value="">{label}</option>
      {options.map((option) => {
        const item = typeof option === "string" ? { id: option, label: option } : option;
        return <option key={item.id} value={item.id}>{item.label}</option>;
      })}
    </select>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border bg-card p-8 text-center">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function appendFilters(formData: FormData, filters: SearchFilters) {
  Object.entries(filters).forEach(([key, value]) => formData.set(key, value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}
