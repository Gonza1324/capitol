import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ToastMessage } from "@/components/feedback/toast-message";
import { CatalogForm } from "@/components/settings/catalog-form";
import { createCatalogItem } from "@/lib/actions/clients";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{ toast?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: industries }, { data: interests }, { data: profiles }] = await Promise.all([
    supabase.from("industries").select("id, name, is_active").order("name"),
    supabase.from("interests").select("id, name, is_active").order("name"),
    supabase.from("profiles").select("id, full_name, email, role").order("email")
  ]);

  return (
    <>
      <ToastMessage code={params.toast} />
      <PageHeader title="Configuracion" description="Administracion minima para rubros, intereses y usuarios internos." />
      <div className="grid gap-6 lg:grid-cols-3">
        <CatalogCard
          title="Rubros"
          description="Categorias configurables para clientes y alertas."
          items={(industries || []) as Array<{ id: string; name: string; is_active: boolean }>}
          form={<CatalogForm kind="industry" action={createCatalogItem} />}
        />
        <CatalogCard
          title="Intereses"
          description="Temas de seguimiento con prioridad por cliente."
          items={(interests || []) as Array<{ id: string; name: string; is_active: boolean }>}
          form={<CatalogForm kind="interest" action={createCatalogItem} />}
        />
        <Card>
          <CardHeader>
            <CardTitle>Usuarios y roles</CardTitle>
            <CardDescription>Vista minima de usuarios creados en Supabase Auth.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {((profiles || []) as Array<{ id: string; full_name: string | null; email: string | null; role: string }>).map((profile) => (
              <div key={profile.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{profile.full_name || profile.email}</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
                <Badge className="mt-2" variant="muted">{profile.role}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function CatalogCard({
  title,
  description,
  items,
  form
}: {
  title: string;
  description: string;
  items: Array<{ id: string; name: string; is_active: boolean }>;
  form: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {items.length ? items.map((item) => <Badge key={item.id} variant={item.is_active ? "secondary" : "muted"}>{item.name}</Badge>) : <p className="text-sm text-muted-foreground">Sin registros todavia.</p>}
        </div>
        {form}
      </CardContent>
    </Card>
  );
}
