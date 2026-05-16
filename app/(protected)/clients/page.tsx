import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ToastMessage } from "@/components/feedback/toast-message";
import { ClientTable, type ClientListRow } from "@/components/clients/client-table";
import { createClient } from "@/lib/supabase/server";
import { getFormOptions } from "@/lib/data/options";

type RawClient = {
  id: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  status: string;
  client_type: string;
  drive_url: string | null;
  start_date: string | null;
  updated_at: string;
  client_industries?: Array<{ industries: { id: string; name: string } | Array<{ id: string; name: string }> | null }>;
  client_interests?: Array<{ priority: string; interests: { id: string; name: string } | Array<{ id: string; name: string }> | null }>;
  client_assignments?: Array<{ role: string | null; profiles: { id: string; full_name: string | null; email: string | null } | Array<{ id: string; full_name: string | null; email: string | null }> | null }>;
};

export default async function ClientsPage({
  searchParams
}: {
  searchParams: Promise<{ toast?: string }>;
}) {
  const [params, options] = await Promise.all([searchParams, getFormOptions()]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select(`
      id,
      name,
      legal_name,
      tax_id,
      status,
      client_type,
      drive_url,
      start_date,
      updated_at,
      client_industries(industries(id, name)),
      client_interests(priority, interests(id, name)),
      client_assignments(role, profiles(id, full_name, email))
    `)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  const clients = ((data || []) as unknown as RawClient[]).map<ClientListRow>((client) => ({
    id: client.id,
    name: client.name,
    legal_name: client.legal_name,
    tax_id: client.tax_id,
    status: client.status,
    client_type: client.client_type,
    drive_url: client.drive_url,
    start_date: client.start_date,
    updated_at: client.updated_at,
    industries: (client.client_industries || []).flatMap((item) => {
      const industry = firstRelation(item.industries);
      return industry ? [industry] : [];
    }),
    interests: (client.client_interests || []).flatMap((item) => {
      const interest = firstRelation(item.interests);
      return interest ? [{ ...interest, priority: item.priority }] : [];
    }),
    assignments: (client.client_assignments || []).flatMap((item) =>
      firstRelation(item.profiles)
        ? [{
            id: firstRelation(item.profiles)!.id,
            label: firstRelation(item.profiles)!.full_name || firstRelation(item.profiles)!.email || "Usuario",
            role: item.role
          }]
        : []
    )
  }));

  return (
    <>
      <ToastMessage code={params.toast} />
      <PageHeader
        title="Clientes"
        description="Gestion operativa de clientes, rubros, issues y responsables."
        actions={<Button asChild><Link href="/clients/new">Nuevo cliente</Link></Button>}
      />
      <ClientTable data={clients} industries={options.industries} interests={options.interests} profiles={options.profiles} />
    </>
  );
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] || null : value || null;
}
