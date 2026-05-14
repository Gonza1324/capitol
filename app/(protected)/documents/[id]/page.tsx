import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ToastMessage } from "@/components/feedback/toast-message";
import { ConfirmAction } from "@/components/feedback/confirm-action";
import { DocumentTypeBadge, SourceTypeBadge } from "@/components/documents/document-badges";
import { archiveDocumentRecord } from "@/lib/actions/documents";
import { getDocumentById } from "@/lib/data/documents";
import { createClient } from "@/lib/supabase/server";

export default async function DocumentDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ toast?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [document, supabase] = await Promise.all([getDocumentById(id), createClient()]);
  if (!document) notFound();
  const { data: activity } = await supabase.from("activity_log").select("action, created_at").eq("entity_type", "document").eq("entity_id", id).order("created_at", { ascending: false }).limit(10);

  return (
    <>
      <ToastMessage code={query.toast} />
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm"><Link href="/documents"><ArrowLeft className="h-4 w-4" /> Volver a documentos</Link></Button>
      </div>
      <PageHeader title={document.name} description="Documento interno" actions={<Button asChild><Link href={`/documents/${document.id}/edit`}>Editar metadata</Link></Button>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Detalle</CardTitle></CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <Info label="Tipo"><DocumentTypeBadge type={document.document_type} /></Info>
              <Info label="Origen"><SourceTypeBadge sourceType={document.source_type} /></Info>
              <Info label="Entidad"><Link className="text-primary underline" href={document.entity_href}>{document.entity_type}</Link></Info>
              <Info label="Subido por">{document.uploader_name || "-"}</Info>
              <Info label="Creacion">{formatDateTime(document.created_at)}</Info>
              <Info label="Actualizacion">{formatDateTime(document.updated_at)}</Info>
              <Info label="Tamaño">{formatSize(document.size || document.size_bytes)}</Info>
              <Info label="MIME type">{document.mime_type || "-"}</Info>
              <Info label="Link externo" wide>{document.external_url ? <a className="text-primary underline" href={document.external_url} target="_blank">{document.external_url}</a> : "-"}</Info>
              <Info label="Storage path" wide>{document.storage_path || "-"}</Info>
              <Info label="Descripcion" wide>{document.description || "-"}</Info>
            </CardContent>
          </Card>
        </div>
        <aside className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {document.file_open_url ? <Button asChild className="w-full"><a href={document.file_open_url} target="_blank"><ExternalLink className="h-4 w-4" /> Abrir archivo</a></Button> : null}
              {document.external_url ? <Button asChild className="w-full" variant="outline"><a href={document.external_url} target="_blank"><ExternalLink className="h-4 w-4" /> Abrir link externo</a></Button> : null}
              <ConfirmAction
                label="Archivar"
                variant="destructive"
                confirmMessage={`Archivar ${document.name}?`}
                action={archiveDocumentRecord.bind(null, document.id, document.entity_type, document.entity_id, "/documents?toast=document_archived")}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Actividad</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {((activity || []) as Array<{ action: string; created_at: string }>).length ? (
                ((activity || []) as Array<{ action: string; created_at: string }>).map((item) => (
                  <div key={`${item.action}-${item.created_at}`} className="rounded-md border px-3 py-2 text-sm">
                    <p className="font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
                  </div>
                ))
              ) : <p className="text-sm text-muted-foreground">Sin actividad.</p>}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}

function Info({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <div className={wide ? "md:col-span-2" : ""}><p className="mb-1 text-xs font-medium uppercase text-muted-foreground">{label}</p><div className="text-sm whitespace-pre-wrap">{children}</div></div>;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function formatSize(value?: number | null) {
  if (!value) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
