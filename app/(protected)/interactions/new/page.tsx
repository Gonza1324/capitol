import { Card, CardContent } from "@/components/ui/card";
import { InteractionForm } from "@/components/forms/interaction-form";
import { PageHeader } from "@/components/page-header";
import { createInteractionRecord } from "@/lib/actions/interactions";
import { getInteractionFormOptions } from "@/lib/data/interactions";

export default async function NewInteractionPage({
  searchParams
}: {
  searchParams: Promise<{ clientId?: string; stakeholderId?: string }>;
}) {
  const [params, options] = await Promise.all([searchParams, getInteractionFormOptions()]);

  return (
    <>
      <PageHeader title="Nueva interaccion" description="Registrar una call, reunion o intercambio relevante." />
      <Card>
        <CardContent className="pt-6">
          <InteractionForm
            action={createInteractionRecord}
            clients={options.clients}
            profiles={options.profiles}
            contacts={options.contacts}
            stakeholders={options.stakeholders}
            lockedClientId={params.clientId}
            interaction={params.stakeholderId ? { external_participants: [{ contact_id: null, stakeholder_id: params.stakeholderId, name: "", email: "" }] } : undefined}
          />
        </CardContent>
      </Card>
    </>
  );
}
