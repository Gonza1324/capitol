import Link from "next/link";
import { ExternalLink, FilePlus, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmAction } from "@/components/feedback/confirm-action";
import { archiveDocumentRecord } from "@/lib/actions/documents";
import { getDocumentsForEntity } from "@/lib/data/documents";
import type { DocumentEntityType } from "@/lib/validators/document";
import { DocumentTypeBadge, SourceTypeBadge } from "./document-badges";

export async function EntityDocuments({
  entityType,
  entityId,
  title = "Documentos"
}: {
  entityType: DocumentEntityType;
  entityId: string;
  title?: string;
}) {
  const documents = await getDocumentsForEntity(entityType, entityId);
  const query = `entityType=${entityType}&entityId=${entityId}`;
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Archivos privados y links externos asociados.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href={`/documents/new?${query}&sourceType=upload`}><FilePlus className="h-4 w-4" /> Subir archivo</Link></Button>
          <Button asChild><Link href={`/documents/new?${query}&sourceType=external_link`}><LinkIcon className="h-4 w-4" /> Agregar link</Link></Button>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length ? (
          <div className="grid gap-3">
            {documents.map((document) => (
              <div key={document.id} className="rounded-md border p-3 text-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/documents/${document.id}`} className="font-medium hover:underline">{document.name}</Link>
                      <DocumentTypeBadge type={document.document_type} />
                      <SourceTypeBadge sourceType={document.source_type} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{document.uploader_name || "Sin usuario"} - {formatDate(document.created_at)} - {formatSize(document.size || document.size_bytes)}</p>
                    {document.description ? <p className="mt-2 line-clamp-2 text-muted-foreground">{document.description}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {document.open_url ? <Button asChild size="sm" variant="outline"><a href={document.open_url} target="_blank"><ExternalLink className="h-4 w-4" /> Abrir</a></Button> : null}
                    {document.source_type === "upload" && document.external_url ? <Button asChild size="sm" variant="outline"><a href={document.external_url} target="_blank"><ExternalLink className="h-4 w-4" /> Link</a></Button> : null}
                    <Button asChild size="sm" variant="outline"><Link href={`/documents/${document.id}/edit`}>Editar</Link></Button>
                    <ConfirmAction
                      label="Archivar"
                      confirmMessage={`Archivar ${document.name}?`}
                      action={archiveDocumentRecord.bind(null, document.id, entityType, entityId, `${entityPath(entityType, entityId)}?toast=document_archived`)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-md border p-4 text-sm text-muted-foreground">Sin documentos para esta entidad.</p>
        )}
      </CardContent>
    </Card>
  );
}

function entityPath(entityType: DocumentEntityType, id: string) {
  const path = entityType === "client" ? "clients" : entityType === "interaction" ? "interactions" : `${entityType}s`;
  return `/${path}/${id}`;
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
