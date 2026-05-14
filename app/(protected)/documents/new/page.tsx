import { Card, CardContent } from "@/components/ui/card";
import { DocumentForm } from "@/components/forms/document-form";
import { PageHeader } from "@/components/page-header";
import { createDocumentRecord } from "@/lib/actions/documents";
import { getDocumentEntityOptions } from "@/lib/data/documents";

export default async function NewDocumentPage({
  searchParams
}: {
  searchParams: Promise<{ entityType?: string; entityId?: string; sourceType?: string }>;
}) {
  const [params, entities] = await Promise.all([searchParams, getDocumentEntityOptions()]);
  return (
    <>
      <PageHeader title="Nuevo documento" description="Subir un archivo privado o registrar un link externo." />
      <Card>
        <CardContent className="pt-6">
          <DocumentForm
            action={createDocumentRecord}
            entities={entities}
            lockedEntityType={params.entityType}
            lockedEntityId={params.entityId}
            lockedSourceType={params.sourceType}
          />
        </CardContent>
      </Card>
    </>
  );
}
