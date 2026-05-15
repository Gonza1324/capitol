import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmAction } from "@/components/feedback/confirm-action";
import { ToastMessage } from "@/components/feedback/toast-message";
import { PageHeader } from "@/components/page-header";
import { formatInteractionDate, InteractionTypeBadge } from "@/components/interactions/interaction-badges";
import { InfluenceBadge, SensitivityBadge, StakeholderTypeBadge, StanceBadge } from "@/components/stakeholders/stakeholder-badges";
import { archiveStakeholderRecord } from "@/lib/actions/stakeholders";
import { firstRelation } from "@/lib/data/tasks";
import { createClient } from "@/lib/supabase/server";
import { EntityDocuments } from "@/components/documents/entity-documents";

type StakeholderDetail = {
  id: string;
  full_name: string;
  organization: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  type: string;
  political_party: string | null;
  jurisdiction: string | null;
  influence_area: string | null;
  influence_level: string | null;
  stance: string | null;
  sensitivity_level: string | null;
  notes: string | null;
  is_active: boolean;
  updated_at: string;
};

type ClientRel = {
  relationship_description: string | null;
  clients: { id: string; name: string } | Array<{ id: string; name: string }> | null;
};

type TopicRel = {
  topics: { id: string; name: string } | Array<{ id: string; name: string }> | null;
};

type InteractionRel = {
  interactions: {
    id: string;
    title: string;
    type: string;
    interaction_date: string | null;
    start_time: string | null;
    end_time: string | null;
    summary: string | null;
    interaction_clients?: Array<{ clients: { id: string; name: string } | Array<{ id: string; name: string }> | null }>;
  } | Array<{
    id: string;
    title: string;
    type: string;
    interaction_date: string | null;
    start_time: string | null;
    end_time: string | null;
    summary: string | null;
    interaction_clients?: Array<{ clients: { id: string; name: string } | Array<{ id: string; name: string }> | null }>;
  }> | null;
};

export default async function StakeholderDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ toast?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const [{ data: stakeholder }, { data: clients }, { data: topics }, { data: interactions }, { data: activity }] = await Promise.all([
    supabase.from("stakeholders").select("*").eq("id", id).is("deleted_at", null).maybeSingle(),
    supabase.from("stakeholder_clients").select("relationship_description, clients(id, name)").eq("stakeholder_id", id),
    supabase.from("stakeholder_topics").select("topics(id, name)").eq("stakeholder_id", id),
    supabase
      .from("interaction_external_participants")
      .select(`
        interactions(
          id,
          title,
          type,
          interaction_date,
          start_time,
          end_time,
          summary,
          interaction_clients(clients(id, name))
        )
      `)
      .eq("stakeholder_id", id)
      .is("interactions.deleted_at", null),
    supabase.from("activity_log").select("action, created_at").eq("entity_type", "stakeholder").eq("entity_id", id).order("created_at", { ascending: false }).limit(12)
  ]);

  if (!stakeholder) notFound();

  const detail = stakeholder as StakeholderDetail;
  const linkedClients = ((clients || []) as unknown as ClientRel[]).flatMap((item) => {
    const client = firstRelation(item.clients);
    return client ? [{ ...client, relationship_description: item.relationship_description }] : [];
  });
  const linkedTopics = ((topics || []) as unknown as TopicRel[]).flatMap((item) => {
    const topic = firstRelation(item.topics);
    return topic ? [topic] : [];
  });
  const interactionRows = ((interactions || []) as unknown as InteractionRel[])
    .flatMap((item) => {
      const interaction = firstRelation(item.interactions);
      return interaction ? [interaction] : [];
    })
    .sort((a, b) => (b.interaction_date || "").localeCompare(a.interaction_date || ""))
    .slice(0, 10);
  const clientIds = linkedClients.map((client) => client.id);

  return (
    <>
      <ToastMessage code={query.toast} />
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/stakeholders"><ArrowLeft className="h-4 w-4" /> Volver a stakeholders</Link>
        </Button>
      </div>
      <PageHeader
        title={detail.full_name}
        description={[detail.title, detail.organization].filter(Boolean).join(" / ") || "Ficha interna de stakeholder"}
        actions={<Button asChild><Link href={`/stakeholders/${detail.id}/edit`}>Editar</Link></Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
              <CardDescription>Datos sensibles internos, relacionamiento y posicionamiento.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <Info label="Tipo"><StakeholderTypeBadge type={detail.type} /></Info>
              <Info label="Estado"><Badge variant={detail.is_active ? "success" : "muted"}>{detail.is_active ? "activo" : "inactivo"}</Badge></Info>
              <Info label="Organizacion">{detail.organization || "-"}</Info>
              <Info label="Cargo">{detail.title || "-"}</Info>
              <Info label="Email">{detail.email ? <a className="text-primary underline" href={`mailto:${detail.email}`}>{detail.email}</a> : "-"}</Info>
              <Info label="Telefono">{detail.phone || "-"}</Info>
              <Info label="LinkedIn">{detail.linkedin_url ? <a className="text-primary underline" href={detail.linkedin_url} target="_blank">Abrir perfil</a> : "-"}</Info>
              <Info label="Partido politico">{detail.political_party || "-"}</Info>
              <Info label="Jurisdiccion">{detail.jurisdiction || "-"}</Info>
              <Info label="Area de influencia">{detail.influence_area || "-"}</Info>
              <Info label="Influencia"><InfluenceBadge level={detail.influence_level} /></Info>
              <Info label="Postura"><StanceBadge stance={detail.stance || "unknown"} /></Info>
              <Info label="Sensibilidad"><SensitivityBadge level={detail.sensitivity_level} /></Info>
              <Info label="Actualizado">{formatDate(detail.updated_at)}</Info>
              <Info label="Observaciones" wide>{detail.notes || "-"}</Info>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>Clientes relacionados</CardTitle>
                <CardDescription>Vinculos actuales con clientes de Capitol.</CardDescription>
              </div>
              <Button asChild variant="outline"><Link href={`/stakeholders/${detail.id}/edit`}>Gestionar vinculos</Link></Button>
            </CardHeader>
            <CardContent>
              {linkedClients.length ? (
                <div className="grid gap-3">
                  {linkedClients.map((client) => (
                    <Link key={client.id} href={`/clients/${client.id}`} className="rounded-md border p-3 text-sm hover:bg-accent">
                      <p className="font-medium">{client.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{client.relationship_description || "Sin descripcion de relacion"}</p>
                    </Link>
                  ))}
                </div>
              ) : <p className="rounded-md border p-4 text-sm text-muted-foreground">Sin clientes relacionados.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Temas / issues</CardTitle>
              <CardDescription>Taxonomia liviana para busqueda y segmentacion.</CardDescription>
            </CardHeader>
            <CardContent>
              <BadgeGroup values={linkedTopics.map((topic) => topic.name)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>Interacciones relacionadas</CardTitle>
                <CardDescription>Calls, reuniones o intercambios donde participo este stakeholder.</CardDescription>
              </div>
              <Button asChild><Link href={`/interactions/new?stakeholderId=${detail.id}`}><CalendarPlus className="h-4 w-4" /> Registrar interaccion</Link></Button>
            </CardHeader>
            <CardContent>
              {interactionRows.length ? (
                <div className="grid gap-3">
                  {interactionRows.map((interaction) => {
                    const clients = (interaction.interaction_clients || []).flatMap((item) => {
                      const client = firstRelation(item.clients);
                      return client ? [client.name] : [];
                    });
                    return (
                      <Link key={interaction.id} href={`/interactions/${interaction.id}`} className="rounded-md border p-3 text-sm hover:bg-accent">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-medium">{interaction.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{formatInteractionDate(interaction.interaction_date, interaction.start_time, interaction.end_time)}</p>
                            <p className="mt-2 line-clamp-2 text-muted-foreground">{interaction.summary || "Sin resumen cargado"}</p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <InteractionTypeBadge type={interaction.type} />
                            {clients.slice(0, 2).map((client) => <Badge key={client} variant="muted">{client}</Badge>)}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : <p className="rounded-md border p-4 text-sm text-muted-foreground">Sin interacciones vinculadas todavia.</p>}
            </CardContent>
          </Card>
          <EntityDocuments entityType="stakeholder" entityId={detail.id} />
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full" variant="outline">
                <Link href={`/interactions/new?stakeholderId=${detail.id}`}>Crear interaccion</Link>
              </Button>
              <ConfirmAction
                label="Archivar / desactivar"
                variant="destructive"
                confirmMessage={`Archivar ${detail.full_name}?`}
                action={archiveStakeholderRecord.bind(null, detail.id, clientIds, "/stakeholders?toast=stakeholder_archived")}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Actividad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {((activity || []) as Array<{ action: string; created_at: string }>).length ? (
                ((activity || []) as Array<{ action: string; created_at: string }>).map((item) => (
                  <div key={`${item.action}-${item.created_at}`} className="rounded-md border px-3 py-2 text-sm">
                    <p className="font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
                  </div>
                ))
              ) : <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}

function Info({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <div className="text-sm whitespace-pre-wrap">{children}</div>
    </div>
  );
}

function BadgeGroup({ values }: { values: string[] }) {
  if (!values.length) return <span className="text-sm text-muted-foreground">-</span>;
  return <div className="flex flex-wrap gap-1">{values.map((value) => <Badge key={value} variant="muted">{value}</Badge>)}</div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
