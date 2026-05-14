import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { StakeholderForm } from "@/components/forms/stakeholder-form";
import { PageHeader } from "@/components/page-header";
import { updateStakeholderRecord } from "@/lib/actions/stakeholders";
import { createClient } from "@/lib/supabase/server";
import { getStakeholderOptions } from "@/lib/data/stakeholders";

export default async function EditStakeholderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: stakeholder }, { data: clients }, { data: topics }, options] = await Promise.all([
    supabase.from("stakeholders").select("*").eq("id", id).is("deleted_at", null).maybeSingle(),
    supabase.from("stakeholder_clients").select("client_id, relationship_description").eq("stakeholder_id", id),
    supabase.from("stakeholder_topics").select("topic_id").eq("stakeholder_id", id),
    getStakeholderOptions()
  ]);
  if (!stakeholder) notFound();
  return <><PageHeader title={`Editar ${stakeholder.full_name}`} /><Card><CardContent className="pt-6"><StakeholderForm action={updateStakeholderRecord.bind(null, id)} stakeholder={{ ...(stakeholder as object), clients: ((clients || []) as Array<{ client_id: string; relationship_description: string | null }>).map((client) => ({ client_id: client.client_id, relationship_description: client.relationship_description || "" })), topic_ids: ((topics || []) as Array<{ topic_id: string }>).map((topic) => topic.topic_id) }} clients={options.clients} topics={options.topics} /></CardContent></Card></>;
}
