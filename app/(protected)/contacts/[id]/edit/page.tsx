import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ContactForm } from "@/components/forms/contact-form";
import { PageHeader } from "@/components/page-header";
import { updateContactRecord } from "@/lib/actions/contacts";
import { createClient } from "@/lib/supabase/server";

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: contact }, { data: clients }] = await Promise.all([
    supabase.from("contacts").select("*").eq("id", id).maybeSingle(),
    supabase.from("clients").select("id, name").is("deleted_at", null).order("name")
  ]);

  if (!contact) notFound();

  return (
    <>
      <PageHeader title={`Editar ${contact.full_name}`} />
      <Card><CardContent className="pt-6"><ContactForm action={updateContactRecord.bind(null, id)} contact={contact} clients={clients || []} /></CardContent></Card>
    </>
  );
}
