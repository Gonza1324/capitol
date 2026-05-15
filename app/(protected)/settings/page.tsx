import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ToastMessage } from "@/components/feedback/toast-message";
import { GoogleCalendarSettings } from "@/components/calendar/google-calendar-settings";
import { CatalogForm } from "@/components/settings/catalog-form";
import { UserManagement } from "@/components/settings/user-management";
import { createCatalogItem } from "@/lib/actions/clients";
import { getCurrentCalendarConnection } from "@/lib/data/google-calendar";
import { isGoogleCalendarEnabled } from "@/lib/google/calendar";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

const internalRoles = ["admin", "partner_director", "analyst", "assistant"];

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{ toast?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const [{ data: industries }, { data: interests }, { data: profiles }, { data: currentProfile }, calendarConnection] = await Promise.all([
    supabase.from("industries").select("id, name, is_active").order("name"),
    supabase.from("interests").select("id, name, is_active").order("name"),
    supabase.from("profiles").select("id, full_name, email, role").order("email"),
    user ? supabase.from("profiles").select("role, full_name, email").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    getCurrentCalendarConnection()
  ]);
  const canUseGoogleCalendar = Boolean(currentProfile?.role && internalRoles.includes(currentProfile.role));
  const accountLabel = currentProfile?.full_name || currentProfile?.email || user?.email || "Usuario";

  return (
    <>
      <ToastMessage code={params.toast} />
      <PageHeader title="Configuracion" description="Administracion minima para rubros, issues y usuarios internos." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Cuenta</CardTitle>
            <CardDescription>Sesion activa en Capitol Hub.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <p className="font-medium">{accountLabel}</p>
              <p className="text-xs text-muted-foreground">{currentProfile?.role || "Sin rol asignado"}</p>
            </div>
            <form action="/auth/sign-out" method="post">
              <Button variant="outline" className="w-full">
                Salir
              </Button>
            </form>
          </CardContent>
        </Card>
        {canUseGoogleCalendar ? (
          <GoogleCalendarSettings connection={calendarConnection} enabled={isGoogleCalendarEnabled()} />
        ) : null}
        <CatalogCard
          title="Rubros"
          description="Categorias configurables para clientes y alertas."
          items={(industries || []) as Array<{ id: string; name: string; is_active: boolean }>}
          form={<CatalogForm kind="industry" action={createCatalogItem} />}
        />
        <CatalogCard
          title="Issues"
          description="Temas de seguimiento con prioridad por cliente."
          items={(interests || []) as Array<{ id: string; name: string; is_active: boolean }>}
          form={<CatalogForm kind="interest" action={createCatalogItem} />}
        />
        <UserManagement
          profiles={(profiles || []) as Array<{ id: string; full_name: string | null; email: string | null; role: UserRole }>}
          canManageUsers={currentProfile?.role === "admin"}
        />
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
