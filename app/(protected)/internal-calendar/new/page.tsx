import { notFound } from "next/navigation";
import { InternalCalendarEventForm } from "@/components/forms/internal-calendar-event-form";
import { PageHeader } from "@/components/page-header";
import { createInternalCalendarEvent } from "@/lib/actions/internal-calendar";
import { getInternalCalendarOptions } from "@/lib/data/internal-calendar";
import { createClient } from "@/lib/supabase/server";

const internalRoles = ["admin", "partner_director", "analyst", "assistant"];

export default async function NewInternalCalendarEventPage({
  searchParams
}: {
  searchParams: Promise<{ clientId?: string; taskId?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : { data: null };
  if (!profile?.role || !internalRoles.includes(profile.role)) notFound();

  const options = await getInternalCalendarOptions();

  return (
    <>
      <PageHeader title="Nuevo evento" description="Agenda una llamada, reunion, recordatorio o seguimiento interno." />
      <InternalCalendarEventForm
        action={createInternalCalendarEvent}
        clients={options.clients}
        contacts={options.contacts}
        stakeholders={options.stakeholders}
        tasks={options.tasks}
        profiles={options.profiles}
        lockedClientId={params.clientId}
        event={{
          client_id: params.clientId || "",
          task_id: params.taskId || ""
        }}
      />
    </>
  );
}
