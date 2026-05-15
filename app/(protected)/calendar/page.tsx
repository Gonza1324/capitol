import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, RefreshCw } from "lucide-react";
import { CalendarEventCard } from "@/components/calendar/calendar-event-card";
import { ToastMessage } from "@/components/feedback/toast-message";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { syncGoogleCalendarEvents } from "@/lib/actions/google-calendar";
import { getCurrentCalendarConnection, getCurrentUserCalendarEvents } from "@/lib/data/google-calendar";
import { isGoogleCalendarEnabled } from "@/lib/google/calendar";
import { createClient } from "@/lib/supabase/server";

const internalRoles = ["admin", "partner_director", "analyst", "assistant"];

export default async function CalendarPage({
  searchParams
}: {
  searchParams: Promise<{ toast?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };

  if (!profile?.role || !internalRoles.includes(profile.role)) {
    notFound();
  }

  const [connection, upcomingEvents, pastEvents, { data: clients }] = await Promise.all([
    getCurrentCalendarConnection(),
    getCurrentUserCalendarEvents({ direction: "upcoming", limit: 12 }),
    getCurrentUserCalendarEvents({ direction: "past", limit: 8 }),
    supabase.from("clients").select("id, name").is("deleted_at", null).order("name")
  ]);
  const enabled = isGoogleCalendarEnabled();
  const clientOptions = (clients || []) as Array<{ id: string; name: string }>;

  return (
    <>
      <ToastMessage code={params.toast} />
      <PageHeader
        title="Google Calendar"
        description="Eventos sincronizados para asociar a clientes y registrar interacciones."
        actions={connection ? (
          <form action={syncGoogleCalendarEvents}>
            <Button type="submit"><RefreshCw className="h-4 w-4" /> Sincronizar</Button>
          </form>
        ) : null}
      />

      {!enabled ? (
        <Card>
          <CardHeader>
            <CardTitle>Integracion sin configurar</CardTitle>
            <CardDescription>Faltan las credenciales de Google Calendar en las variables de entorno.</CardDescription>
          </CardHeader>
        </Card>
      ) : !connection ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Conectar calendario</CardTitle>
            <CardDescription>Conecta tu cuenta para leer tus eventos y crear interacciones desde Capitol Hub.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild><Link href="/api/google/calendar/connect">Conectar Google Calendar</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Proximos eventos</CardTitle>
              <CardDescription>Asocialos a clientes o converti reuniones relevantes en interacciones.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.length ? upcomingEvents.map((event) => (
                <CalendarEventCard key={event.id} event={event} clients={clientOptions} />
              )) : <p className="text-sm text-muted-foreground">No hay eventos proximos sincronizados.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eventos recientes</CardTitle>
              <CardDescription>Ultimas reuniones pasadas disponibles para registrar memoria institucional.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pastEvents.length ? pastEvents.map((event) => (
                <CalendarEventCard key={event.id} event={event} clients={clientOptions} compact />
              )) : <p className="text-sm text-muted-foreground">No hay eventos recientes sincronizados.</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
