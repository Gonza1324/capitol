import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ConfirmAction } from "@/components/feedback/confirm-action";
import { ToastMessage } from "@/components/feedback/toast-message";
import { archiveContactRecord } from "@/lib/actions/contacts";
import { createClient } from "@/lib/supabase/server";

export default async function ContactsPage({
  searchParams
}: {
  searchParams: Promise<{ toast?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, client_id, full_name, title, email, is_primary, is_active, clients(name)")
    .is("deleted_at", null)
    .order("full_name");
  const contactRows = (contacts || []) as Array<{
    id: string;
    client_id: string;
    full_name: string;
    title: string | null;
    email: string | null;
    is_primary: boolean;
    is_active: boolean;
    clients: { name: string } | { name: string }[] | null;
  }>;

  return (
    <>
      <ToastMessage code={params.toast} />
      <PageHeader title="Contactos" description="Contactos asociados a clientes." actions={<Button asChild><Link href="/contacts/new">Nuevo contacto</Link></Button>} />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {contactRows.map((contact) => (
                  <tr key={contact.id} className="border-b">
                    <td className="px-4 py-3">
                      <p className="font-medium">{contact.full_name}</p>
                      <p className="text-xs text-muted-foreground">{contact.title}</p>
                    </td>
                    <td className="px-4 py-3">{Array.isArray(contact.clients) ? contact.clients[0]?.name : contact.clients?.name}</td>
                    <td className="px-4 py-3">{contact.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Badge variant={contact.is_active ? "success" : "muted"}>{contact.is_active ? "active" : "inactive"}</Badge>
                        {contact.is_primary ? <Badge variant="secondary">primary</Badge> : null}
                      </div>
                    </td>
                    <td className="flex gap-2 px-4 py-3">
                      <Button asChild variant="outline" size="sm"><Link href={`/contacts/${contact.id}/edit`}>Editar</Link></Button>
                      <ConfirmAction label="Archivar" confirmMessage={`Archivar ${contact.full_name}?`} action={archiveContactRecord.bind(null, contact.id, contact.client_id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!contactRows.length ? (
              <div className="p-8 text-center">
                <h2 className="text-base font-semibold">Todavia no hay contactos</h2>
                <p className="mt-2 text-sm text-muted-foreground">Carga contactos desde un cliente o desde este modulo.</p>
                <Button asChild className="mt-4"><Link href="/contacts/new">Nuevo contacto</Link></Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
