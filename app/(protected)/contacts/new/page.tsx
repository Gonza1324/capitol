import { Card, CardContent } from "@/components/ui/card";
import { ContactForm } from "@/components/forms/contact-form";
import { PageHeader } from "@/components/page-header";
import { createContactRecord } from "@/lib/actions/contacts";
import { createClient } from "@/lib/supabase/server";

export default async function NewContactPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase.from("clients").select("id, name").is("deleted_at", null).order("name");

  return (
    <>
      <PageHeader title="Nuevo contacto" />
      <Card><CardContent className="pt-6"><ContactForm action={createContactRecord} clients={clients || []} /></CardContent></Card>
    </>
  );
}
