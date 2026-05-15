import { notFound } from "next/navigation";
import { InternalCalendarEventForm } from "@/components/forms/internal-calendar-event-form";
import { PageHeader } from "@/components/page-header";
import { updateInternalCalendarEvent } from "@/lib/actions/internal-calendar";
import { getInternalCalendarOptions } from "@/lib/data/internal-calendar";
import { createClient } from "@/lib/supabase/server";

const internalRoles = ["admin", "partner_director", "analyst", "assistant"];

export default async function EditInternalCalendarEventPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : { data: null };
  if (!profile?.role || !internalRoles.includes(profile.role)) notFound();

  const [{ data: event }, options] = await Promise.all([
    supabase.from("internal_calendar_events").select("*").eq("id", id).is("deleted_at", null).maybeSingle(),
    getInternalCalendarOptions()
  ]);
  if (!event) notFound();

  return (
    <>
      <PageHeader title="Editar evento" description="Actualiza la agenda interna sin modificar integraciones externas." />
      <InternalCalendarEventForm
        action={updateInternalCalendarEvent.bind(null, id)}
        event={event}
        clients={options.clients}
        contacts={options.contacts}
        stakeholders={options.stakeholders}
        tasks={options.tasks}
        profiles={options.profiles}
      />
    </>
  );
}
