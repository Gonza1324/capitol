import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ToastMessage } from "@/components/feedback/toast-message";
import { StakeholderWorkspace, type StakeholderListRow } from "@/components/stakeholders/stakeholder-workspace";
import { createClient } from "@/lib/supabase/server";
import { getStakeholderOptions } from "@/lib/data/stakeholders";
import { firstRelation } from "@/lib/data/tasks";

type RawStakeholder = StakeholderListRow & {
  stakeholder_clients?: Array<{ clients: { id: string; name: string } | Array<{ id: string; name: string }> | null }>;
};

export default async function StakeholdersPage({ searchParams }: { searchParams: Promise<{ toast?: string }> }) {
  const [params, options] = await Promise.all([searchParams, getStakeholderOptions()]);
  const supabase = await createClient();
  const { data } = await supabase.from("stakeholders").select("*, stakeholder_clients(clients(id, name))").is("deleted_at", null).order("updated_at", { ascending: false });
  const stakeholders = ((data || []) as unknown as RawStakeholder[]).map<StakeholderListRow>((row) => ({
    id: row.id,
    full_name: row.full_name,
    type: row.type,
    organization: row.organization,
    title: row.title,
    email: row.email,
    jurisdiction: row.jurisdiction,
    influence_area: row.influence_area,
    influence_level: row.influence_level,
    stance: row.stance,
    sensitivity_level: row.sensitivity_level,
    notes: row.notes,
    is_active: row.is_active,
    updated_at: row.updated_at,
    clients: (row.stakeholder_clients || []).flatMap((item) => {
      const client = firstRelation(item.clients);
      return client ? [client] : [];
    })
  }));
  return <><ToastMessage code={params.toast} /><PageHeader title="Stakeholders" description="Base interna de actores relevantes." actions={<Button asChild><Link href="/stakeholders/new">Nuevo stakeholder</Link></Button>} /><StakeholderWorkspace stakeholders={stakeholders} clients={options.clients} /></>;
}
