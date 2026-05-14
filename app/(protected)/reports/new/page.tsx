import { Card, CardContent } from "@/components/ui/card";
import { ReportForm } from "@/components/forms/report-form";
import { PageHeader } from "@/components/page-header";
import { createReportRecord } from "@/lib/actions/reports";
import { getCommunicationOptions } from "@/lib/data/communications";

export default async function NewReportPage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
  const [params, options] = await Promise.all([searchParams, getCommunicationOptions()]);
  return <><PageHeader title="Nuevo reporte" description="Registrar un reporte creado o enviado externamente." /><Card><CardContent className="pt-6"><ReportForm action={createReportRecord} clients={options.clients} profiles={options.profiles} contacts={options.contacts} lockedClientId={params.clientId} /></CardContent></Card></>;
}
