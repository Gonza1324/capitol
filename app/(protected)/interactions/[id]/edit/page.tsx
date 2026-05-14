import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { InteractionForm } from "@/components/forms/interaction-form";
import { PageHeader } from "@/components/page-header";
import { updateInteractionRecord } from "@/lib/actions/interactions";
import { createClient } from "@/lib/supabase/server";
import { getInteractionFormOptions } from "@/lib/data/interactions";

export default async function EditInteractionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: interaction }, { data: clients }, { data: internal }, { data: external }, options] = await Promise.all([
    supabase.from("interactions").select("*").eq("id", id).is("deleted_at", null).maybeSingle(),
    supabase.from("interaction_clients").select("client_id").eq("interaction_id", id),
    supabase.from("interaction_internal_participants").select("user_id").eq("interaction_id", id),
    supabase.from("interaction_external_participants").select("contact_id, stakeholder_id, name, email").eq("interaction_id", id),
    getInteractionFormOptions()
  ]);

  if (!interaction) notFound();

  const value = interaction as typeof interaction & {
    google_calendar_event_id?: string | null;
    google_meet_url?: string | null;
    description?: string | null;
  };

  return (
    <>
      <PageHeader title={`Editar ${value.title}`} />
      <Card>
        <CardContent className="pt-6">
          <InteractionForm
            action={updateInteractionRecord.bind(null, id)}
            interaction={{
              ...value,
              client_ids: ((clients || []) as Array<{ client_id: string }>).map((item) => item.client_id),
              internal_participant_ids: ((internal || []) as Array<{ user_id: string }>).map((item) => item.user_id),
              external_participants: ((external || []) as Array<{ contact_id: string | null; stakeholder_id: string | null; name: string | null; email: string | null }>).map((item) => ({
                contact_id: item.contact_id,
                stakeholder_id: item.stakeholder_id,
                name: item.name || "",
                email: item.email || ""
              }))
            }}
            clients={options.clients}
            profiles={options.profiles}
            contacts={options.contacts}
            stakeholders={options.stakeholders}
          />
        </CardContent>
      </Card>
    </>
  );
}
