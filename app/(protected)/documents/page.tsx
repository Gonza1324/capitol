import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ToastMessage } from "@/components/feedback/toast-message";
import { DocumentWorkspace } from "@/components/documents/document-workspace";
import { getAllDocuments } from "@/lib/data/documents";

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ toast?: string }> }) {
  const [params, documents] = await Promise.all([searchParams, getAllDocuments()]);
  const users = Array.from(new Set(documents.flatMap((document) => document.uploader_name ? [document.uploader_name] : []))).sort();
  return (
    <>
      <ToastMessage code={params.toast} />
      <PageHeader
        title="Documentos"
        description="Repositorio interno de archivos privados y links externos."
        actions={<Button asChild><Link href="/documents/new">Nuevo documento</Link></Button>}
      />
      <DocumentWorkspace documents={documents} users={users} />
    </>
  );
}
