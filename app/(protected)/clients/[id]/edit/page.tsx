import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ClientForm } from "@/components/forms/client-form";
import { PageHeader } from "@/components/page-header";
import { updateClientRecord } from "@/lib/actions/clients";
import { getFormOptions } from "@/lib/data/options";
import { createClient } from "@/lib/supabase/server";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: client }, options] = await Promise.all([
    supabase
      .from("clients")
      .select(`
        *,
        client_industries(industry_id),
        client_interests(interest_id, priority, start_date, end_date),
        client_assignments(user_id, role)
      `)
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle(),
    getFormOptions()
  ]);

  if (!client) notFound();
  const clientValue = client as typeof client & {
    client_industries?: Array<{ industry_id: string }>;
    client_interests?: Array<{ interest_id: string; priority: "high" | "medium" | "low"; start_date: string | null; end_date: string | null }>;
    client_assignments?: Array<{ user_id: string; role: string | null }>;
  };

  return (
    <>
      <PageHeader title={`Editar ${clientValue.name}`} />
      <Card>
        <CardContent className="pt-6">
          <ClientForm
            action={updateClientRecord.bind(null, id)}
            client={{
              ...clientValue,
              industry_ids: (clientValue.client_industries || []).map((item: { industry_id: string }) => item.industry_id),
              interests: clientValue.client_interests || [],
              assignments: clientValue.client_assignments || []
            }}
            industries={options.industries}
            interests={options.interests}
            profiles={options.profiles}
          />
        </CardContent>
      </Card>
    </>
  );
}
