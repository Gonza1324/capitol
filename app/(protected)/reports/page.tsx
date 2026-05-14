import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ToastMessage } from "@/components/feedback/toast-message";
import { ReportWorkspace, type ReportListRow } from "@/components/reports/report-workspace";
import { createClient } from "@/lib/supabase/server";
import { getCommunicationOptions } from "@/lib/data/communications";
import { firstRelation } from "@/lib/data/tasks";

type RawReport = {
  id: string; title: string; type: string; status: string; topic: string | null; description: string | null; notes: string | null; sent_at: string | null; approval_required: boolean; approved_by: string | null; approved_at: string | null; responsible_id: string | null; updated_at: string;
  report_clients?: Array<{ clients: { id: string; name: string } | Array<{ id: string; name: string }> | null }>;
};

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ toast?: string }> }) {
  const [params, options] = await Promise.all([searchParams, getCommunicationOptions()]);
  const supabase = await createClient();
  const { data } = await supabase.from("reports").select("*, report_clients(clients(id, name))").is("deleted_at", null).order("updated_at", { ascending: false });
  const labels = new Map(options.profiles.map((p) => [p.id, p.label]));
  const reports = ((data || []) as unknown as RawReport[]).map<ReportListRow>((report) => ({
    id: report.id, title: report.title, type: report.type, status: report.status, topic: report.topic, description: report.description, notes: report.notes, sent_at: report.sent_at, approval_required: report.approval_required, approved_by: report.approved_by, approved_at: report.approved_at, responsible_name: report.responsible_id ? labels.get(report.responsible_id) || null : null, updated_at: report.updated_at,
    clients: (report.report_clients || []).flatMap((item) => { const client = firstRelation(item.clients); return client ? [client] : []; })
  }));
  return <><ToastMessage code={params.toast} /><PageHeader title="Reportes enviados" description="Historial interno de reportes enviados o registrados." actions={<Button asChild><Link href="/reports/new">Nuevo reporte</Link></Button>} /><ReportWorkspace reports={reports} clients={options.clients} profiles={options.profiles} /></>;
}
