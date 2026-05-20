import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ToastMessage } from "@/components/feedback/toast-message";
import { ClientTable, type ClientListRow } from "@/components/clients/client-table";
import { createClient } from "@/lib/supabase/server";

type RawClient = {
  id: string;
  name: string;
  drive_url: string | null;
};

export default async function ClientsPage({
  searchParams
}: {
  searchParams: Promise<{ toast?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select(`
      id,
      name,
      drive_url
    `)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  const clients = ((data || []) as unknown as RawClient[]).map<ClientListRow>((client) => ({
    id: client.id,
    name: client.name,
    drive_url: client.drive_url
  }));

  return (
    <>
      <ToastMessage code={params.toast} />
      <PageHeader
        title="Clientes"
        description="Gestion operativa de clientes."
        actions={<Button asChild><Link href="/clients/new">Nuevo cliente</Link></Button>}
      />
      <ClientTable data={clients} />
    </>
  );
}
