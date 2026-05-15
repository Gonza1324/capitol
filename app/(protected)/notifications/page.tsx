import Link from "next/link";
import { notFound } from "next/navigation";
import { Bell, CheckCheck, RefreshCw } from "lucide-react";
import { ToastMessage } from "@/components/feedback/toast-message";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { markAllNotificationsRead, markNotificationRead, refreshInternalReminders } from "@/lib/actions/notifications";
import { createClient } from "@/lib/supabase/server";

const internalRoles = ["admin", "partner_director", "analyst", "assistant"];

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
};

export default async function NotificationsPage({
  searchParams
}: {
  searchParams: Promise<{ toast?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : { data: null };
  if (!profile?.role || !internalRoles.includes(profile.role)) notFound();

  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, entity_type, entity_id, read_at, created_at")
    .eq("user_id", user?.id || "")
    .order("created_at", { ascending: false })
    .limit(80);

  const notifications = (data || []) as NotificationRow[];
  const unread = notifications.filter((item) => !item.read_at);
  const read = notifications.filter((item) => item.read_at).slice(0, 30);

  return (
    <>
      <ToastMessage code={params.toast} />
      <PageHeader
        title="Notificaciones"
        description="Recordatorios internos de tareas, calendario y aprobaciones."
        actions={(
          <div className="flex flex-wrap gap-2">
            <form action={refreshInternalReminders}>
              <Button type="submit" variant="outline"><RefreshCw className="h-4 w-4" /> Actualizar recordatorios</Button>
            </form>
            <form action={markAllNotificationsRead}>
              <Button type="submit"><CheckCheck className="h-4 w-4" /> Marcar todas como leidas</Button>
            </form>
          </div>
        )}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <NotificationList title={`No leidas (${unread.length})`} description="Pendientes de revisar." notifications={unread} empty="No tenes notificaciones pendientes." />
        <Card>
          <CardHeader>
            <CardTitle>Recordatorios</CardTitle>
            <CardDescription>Sin scheduler externo, se actualizan manualmente desde esta pantalla.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Se generan recordatorios para tareas vencidas, tareas proximas a vencer, eventos proximos y eventos pasados sin interaccion.</p>
            <p>No se envian emails reales en esta fase.</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <NotificationList title="Leidas recientes" description="Ultimas notificaciones ya revisadas." notifications={read} empty="No hay notificaciones leidas recientes." />
      </div>
    </>
  );
}

function NotificationList({ title, description, notifications, empty }: { title: string; description: string; notifications: NotificationRow[]; empty: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.length ? notifications.map((item) => (
          <div key={item.id} className="rounded-md border p-4 text-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{item.title}</p>
                  <Badge variant={item.read_at ? "muted" : "secondary"}>{item.type}</Badge>
                </div>
                {item.body ? <p className="mt-2 text-muted-foreground">{item.body}</p> : null}
                <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {item.entity_type && item.entity_id ? (
                  <Button asChild variant="outline" size="sm"><Link href={entityHref(item.entity_type, item.entity_id)}>Abrir</Link></Button>
                ) : null}
                {!item.read_at ? (
                  <form action={markNotificationRead.bind(null, item.id)}>
                    <Button type="submit" variant="secondary" size="sm">Marcar leida</Button>
                  </form>
                ) : null}
              </div>
            </div>
          </div>
        )) : <p className="rounded-md border p-4 text-sm text-muted-foreground">{empty}</p>}
      </CardContent>
    </Card>
  );
}

function entityHref(entityType: string, entityId: string) {
  if (entityType === "task") return `/tasks/${entityId}`;
  if (entityType === "interaction") return `/interactions/${entityId}`;
  if (entityType === "internal_calendar_event") return `/internal-calendar/${entityId}`;
  if (entityType === "report") return `/reports/${entityId}`;
  if (entityType === "alert") return `/alerts/${entityId}`;
  if (entityType === "stakeholder") return `/stakeholders/${entityId}`;
  if (entityType === "client") return `/clients/${entityId}`;
  return "/notifications";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
