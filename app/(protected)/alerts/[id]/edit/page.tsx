import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { AlertForm } from "@/components/forms/alert-form";
import { PageHeader } from "@/components/page-header";
import { updateAlertRecord } from "@/lib/actions/alerts";
import { getCommunicationOptions } from "@/lib/data/communications";
import { createClient } from "@/lib/supabase/server";

export default async function EditAlertPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: alert }, { data: clients }, { data: industries }, { data: interests }, { data: recipients }, options] = await Promise.all([
    supabase.from("alerts").select("*").eq("id", id).is("deleted_at", null).maybeSingle(),
    supabase.from("alert_clients").select("client_id").eq("alert_id", id),
    supabase.from("alert_industries").select("industry_id").eq("alert_id", id),
    supabase.from("alert_interests").select("interest_id").eq("alert_id", id),
    supabase.from("alert_recipients").select("contact_id, name, email").eq("alert_id", id),
    getCommunicationOptions()
  ]);
  if (!alert) notFound();
  return <><PageHeader title={`Editar ${alert.title}`} /><Card><CardContent className="pt-6"><AlertForm action={updateAlertRecord.bind(null, id)} alert={{ ...(alert as object), client_ids: ((clients || []) as Array<{ client_id: string }>).map((c) => c.client_id), industry_ids: ((industries || []) as Array<{ industry_id: string }>).map((i) => i.industry_id), interest_ids: ((interests || []) as Array<{ interest_id: string }>).map((i) => i.interest_id), recipients: ((recipients || []) as Array<{ contact_id: string | null; name: string | null; email: string | null }>).map((r) => ({ contact_id: r.contact_id, name: r.name || "", email: r.email || "" })) }} clients={options.clients} profiles={options.profiles} contacts={options.contacts} industries={options.industries} interests={options.interests} /></CardContent></Card></>;
}
