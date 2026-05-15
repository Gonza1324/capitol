import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { disconnectGoogleCalendar, syncGoogleCalendarEvents } from "@/lib/actions/google-calendar";
import type { CalendarConnectionPublic } from "@/lib/data/google-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function GoogleCalendarSettings({ connection, enabled }: { connection: CalendarConnectionPublic | null; enabled: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" /> Google Calendar
        </CardTitle>
        <CardDescription>Conexion personal para leer eventos y convertirlos en interacciones.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!enabled ? (
          <p className="text-sm text-muted-foreground">La integracion todavia no tiene credenciales configuradas.</p>
        ) : connection ? (
          <>
            <div className="rounded-md border bg-secondary p-3 text-sm">
              <p className="font-medium">{connection.google_account_email || "Cuenta conectada"}</p>
              <p className="text-muted-foreground">
                Ultima sincronizacion: {connection.last_synced_at ? new Date(connection.last_synced_at).toLocaleString("es-AR") : "pendiente"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={syncGoogleCalendarEvents}>
                <Button type="submit">Sincronizar eventos</Button>
              </form>
              <Button asChild variant="outline">
                <Link href="/calendar">Ver eventos</Link>
              </Button>
              <form action={disconnectGoogleCalendar}>
                <Button type="submit" variant="destructive">Desconectar</Button>
              </form>
            </div>
          </>
        ) : (
          <Button asChild>
            <Link href="/api/google/calendar/connect">Conectar Google Calendar</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
