import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ToastMessage } from "@/components/feedback/toast-message";
import { InteractionWorkspace, type InteractionListRow } from "@/components/interactions/interaction-workspace";
import { createClient } from "@/lib/supabase/server";
import { firstRelation, getInteractionFormOptions } from "@/lib/data/interactions";

type RawInteraction = {
  id: string;
  title: string;
  type: string;
  description: string | null;
  interaction_date: string | null;
  start_time: string | null;
  end_time: string | null;
  summary: string | null;
  notes: string | null;
  decisions: string | null;
  risks: string | null;
  next_steps: string | null;
  created_by: string | null;
  updated_at: string;
  interaction_clients?: Array<{ clients: { id: string; name: string } | Array<{ id: string; name: string }> | null }>;
  interaction_internal_participants?: Array<{ profiles: { id: string; full_name: string | null; email: string | null } | Array<{ id: string; full_name: string | null; email: string | null }> | null }>;
  interaction_external_participants?: Array<{ name: string | null; email: string | null; contacts: { full_name: string; email: string | null } | Array<{ full_name: string; email: string | null }> | null; stakeholders: { full_name: string } | Array<{ full_name: string }> | null }>;
};

export default async function InteractionsPage({
  searchParams
}: {
  searchParams: Promise<{ toast?: string }>;
}) {
  const [params, options] = await Promise.all([searchParams, getInteractionFormOptions()]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("interactions")
    .select(`
      id,
      title,
      type,
      description,
      interaction_date,
      start_time,
      end_time,
      summary,
      notes,
      decisions,
      risks,
      next_steps,
      created_by,
      updated_at,
      interaction_clients(clients(id, name)),
      interaction_internal_participants(profiles(id, full_name, email)),
      interaction_external_participants(name, email, contacts(full_name, email), stakeholders(full_name))
    `)
    .is("deleted_at", null)
    .order("interaction_date", { ascending: false, nullsFirst: false });

  const profileLabels = new Map(options.profiles.map((profile) => [profile.id, profile.label]));
  const interactions = ((data || []) as unknown as RawInteraction[]).map<InteractionListRow>((interaction) => ({
    id: interaction.id,
    title: interaction.title,
    type: interaction.type,
    description: interaction.description,
    interaction_date: interaction.interaction_date,
    start_time: interaction.start_time,
    end_time: interaction.end_time,
    summary: interaction.summary,
    notes: interaction.notes,
    decisions: interaction.decisions,
    risks: interaction.risks,
    next_steps: interaction.next_steps,
    created_by_name: interaction.created_by ? profileLabels.get(interaction.created_by) || null : null,
    updated_at: interaction.updated_at,
    clients: (interaction.interaction_clients || []).flatMap((item) => {
      const client = firstRelation(item.clients);
      return client ? [client] : [];
    }),
    internalParticipants: (interaction.interaction_internal_participants || []).flatMap((item) => {
      const profile = firstRelation(item.profiles);
      return profile ? [{ id: profile.id, label: profile.full_name || profile.email || "Usuario" }] : [];
    }),
    externalParticipants: (interaction.interaction_external_participants || []).map((item) => {
      const contact = firstRelation(item.contacts);
      const stakeholder = firstRelation(item.stakeholders);
      return contact?.full_name || stakeholder?.full_name || item.name || item.email || "Participante";
    }),
    derivedTaskCount: 0
  }));

  if (interactions.length) {
    const { data: derivedTasks } = await supabase
      .from("tasks")
      .select("origin_id")
      .eq("origin_type", "interaction")
      .is("deleted_at", null);
    const counts = new Map<string, number>();
    ((derivedTasks || []) as Array<{ origin_id: string | null }>).forEach((task) => {
      if (task.origin_id) counts.set(task.origin_id, (counts.get(task.origin_id) || 0) + 1);
    });
    interactions.forEach((interaction) => {
      interaction.derivedTaskCount = counts.get(interaction.id) || 0;
    });
  }

  return (
    <>
      <ToastMessage code={params.toast} />
      <PageHeader
        title="Calls / Interacciones"
        description="Registro de calls, reuniones, emails importantes y proximos pasos."
        actions={<Button asChild><Link href="/interactions/new">Nueva interaccion</Link></Button>}
      />
      <InteractionWorkspace interactions={interactions} clients={options.clients} profiles={options.profiles} />
    </>
  );
}
