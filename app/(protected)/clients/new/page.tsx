import { Card, CardContent } from "@/components/ui/card";
import { ClientForm } from "@/components/forms/client-form";
import { PageHeader } from "@/components/page-header";
import { createClientRecord } from "@/lib/actions/clients";
import { getFormOptions } from "@/lib/data/options";

export default async function NewClientPage() {
  const options = await getFormOptions();

  return (
    <>
      <PageHeader title="Nuevo cliente" description="Carga manual inicial del cliente y sus relaciones." />
      <Card>
        <CardContent className="pt-6">
          <ClientForm action={createClientRecord} industries={options.industries} interests={options.interests} profiles={options.profiles} />
        </CardContent>
      </Card>
    </>
  );
}
