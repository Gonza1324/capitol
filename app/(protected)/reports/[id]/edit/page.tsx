import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ReportForm } from "@/components/forms/report-form";
import { PageHeader } from "@/components/page-header";
import { updateReportRecord } from "@/lib/actions/reports";
import { getCommunicationOptions } from "@/lib/data/communications";
import { createClient } from "@/lib/supabase/server";

export default async function EditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: report }, { data: clients }, { data: recipients }, options] = await Promise.all([
    supabase.from("reports").select("*").eq("id", id).is("deleted_at", null).maybeSingle(),
    supabase.from("report_clients").select("client_id").eq("report_id", id),
    supabase.from("report_recipients").select("contact_id, name, email").eq("report_id", id),
    getCommunicationOptions()
  ]);
  if (!report) notFound();
  return <><PageHeader title={`Editar ${report.title}`} /><Card><CardContent className="pt-6"><ReportForm action={updateReportRecord.bind(null, id)} report={{ ...(report as object), client_ids: ((clients || []) as Array<{ client_id: string }>).map((c) => c.client_id), recipients: ((recipients || []) as Array<{ contact_id: string | null; name: string | null; email: string | null }>).map((r) => ({ contact_id: r.contact_id, name: r.name || "", email: r.email || "" })) }} clients={options.clients} profiles={options.profiles} contacts={options.contacts} /></CardContent></Card></>;
}
