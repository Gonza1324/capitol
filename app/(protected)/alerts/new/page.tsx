import { Card, CardContent } from "@/components/ui/card";
import { AlertForm } from "@/components/forms/alert-form";
import { PageHeader } from "@/components/page-header";
import { createAlertRecord } from "@/lib/actions/alerts";
import { getCommunicationOptions } from "@/lib/data/communications";

export default async function NewAlertPage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
  const [params, options] = await Promise.all([searchParams, getCommunicationOptions()]);
  return <><PageHeader title="Nueva alerta" description="Registrar una alerta enviada manualmente." /><Card><CardContent className="pt-6"><AlertForm action={createAlertRecord} clients={options.clients} profiles={options.profiles} contacts={options.contacts} industries={options.industries} interests={options.interests} lockedClientId={params.clientId} /></CardContent></Card></>;
}
