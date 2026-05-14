import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ToastMessage } from "@/components/feedback/toast-message";
import { AlertWorkspace, type AlertListRow } from "@/components/alerts/alert-workspace";
import { createClient } from "@/lib/supabase/server";
import { getCommunicationOptions } from "@/lib/data/communications";
import { firstRelation } from "@/lib/data/tasks";

type RawAlert = {
  id: string; title: string; category: string; urgency: string; medium: string; description: string | null; content: string | null; notes: string | null; sent_at: string | null; responsible_id: string | null; updated_at: string;
  alert_clients?: Array<{ clients: { id: string; name: string } | Array<{ id: string; name: string }> | null }>;
  alert_industries?: Array<{ industries: { id: string; name: string } | Array<{ id: string; name: string }> | null }>;
  alert_interests?: Array<{ interests: { id: string; name: string } | Array<{ id: string; name: string }> | null }>;
};

export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ toast?: string }> }) {
  const [params, options] = await Promise.all([searchParams, getCommunicationOptions()]);
  const supabase = await createClient();
  const { data } = await supabase.from("alerts").select("*, alert_clients(clients(id, name)), alert_industries(industries(id, name)), alert_interests(interests(id, name))").is("deleted_at", null).order("updated_at", { ascending: false });
  const labels = new Map(options.profiles.map((p) => [p.id, p.label]));
  const alerts = ((data || []) as unknown as RawAlert[]).map<AlertListRow>((alert) => ({
    id: alert.id, title: alert.title, category: alert.category, urgency: alert.urgency, medium: alert.medium, description: alert.description, content: alert.content, notes: alert.notes, sent_at: alert.sent_at, responsible_name: alert.responsible_id ? labels.get(alert.responsible_id) || null : null, updated_at: alert.updated_at,
    clients: (alert.alert_clients || []).flatMap((item) => { const client = firstRelation(item.clients); return client ? [client] : []; }),
    industries: (alert.alert_industries || []).flatMap((item) => { const industry = firstRelation(item.industries); return industry ? [industry] : []; }),
    interests: (alert.alert_interests || []).flatMap((item) => { const interest = firstRelation(item.interests); return interest ? [interest] : []; })
  }));
  return <><ToastMessage code={params.toast} /><PageHeader title="Alertas enviadas" description="Registro interno de alertas enviadas manualmente." actions={<Button asChild><Link href="/alerts/new">Nueva alerta</Link></Button>} /><AlertWorkspace alerts={alerts} clients={options.clients} profiles={options.profiles} industries={options.industries} interests={options.interests} /></>;
}
