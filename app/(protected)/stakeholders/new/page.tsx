import { Card, CardContent } from "@/components/ui/card";
import { StakeholderForm } from "@/components/forms/stakeholder-form";
import { PageHeader } from "@/components/page-header";
import { createStakeholderRecord } from "@/lib/actions/stakeholders";
import { getStakeholderOptions } from "@/lib/data/stakeholders";

export default async function NewStakeholderPage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
  const [params, options] = await Promise.all([searchParams, getStakeholderOptions()]);
  return <><PageHeader title="Nuevo stakeholder" description="Registrar actor relevante interno." /><Card><CardContent className="pt-6"><StakeholderForm action={createStakeholderRecord} clients={options.clients} topics={options.topics} lockedClientId={params.clientId} /></CardContent></Card></>;
}
