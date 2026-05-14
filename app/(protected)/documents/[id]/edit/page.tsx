import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentForm } from "@/components/forms/document-form";
import { PageHeader } from "@/components/page-header";
import { updateDocumentRecord } from "@/lib/actions/documents";
import { getDocumentById, getDocumentEntityOptions } from "@/lib/data/documents";
import type { DocumentMetadataValues } from "@/lib/validators/document";

export default async function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [document, entities] = await Promise.all([getDocumentById(id), getDocumentEntityOptions()]);
  if (!document) notFound();
  const formDocument = {
    name: document.name,
    description: document.description,
    document_type: document.document_type,
    source_type: document.source_type,
    external_url: document.external_url,
    entity_type: document.entity_type,
    entity_id: document.entity_id
  } as Partial<DocumentMetadataValues>;
  return (
    <>
      <PageHeader title={`Editar ${document.name}`} description="Editar metadata y asociacion del documento." />
      <Card>
        <CardContent className="pt-6">
          <DocumentForm
            action={updateDocumentRecord.bind(null, document.id)}
            document={formDocument}
            entities={entities}
            isEdit
          />
        </CardContent>
      </Card>
    </>
  );
}
