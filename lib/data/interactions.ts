import { createClient } from "@/lib/supabase/server";
import { firstRelation } from "./tasks";

export async function getInteractionFormOptions() {
  const supabase = await createClient();
  const [{ data: clients }, { data: profiles }, { data: contacts }, { data: stakeholders }] = await Promise.all([
    supabase.from("clients").select("id, name").is("deleted_at", null).order("name"),
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("role", ["admin", "partner_director", "analyst", "assistant"])
      .order("full_name"),
    supabase.from("contacts").select("id, full_name, email, client_id").is("deleted_at", null).order("full_name"),
    supabase.from("stakeholders").select("id, full_name, organization").is("deleted_at", null).order("full_name")
  ]);

  return {
    clients: (clients || []) as Array<{ id: string; name: string }>,
    profiles: ((profiles || []) as Array<{ id: string; full_name: string | null; email: string | null; role: string }>).map((profile) => ({
      id: profile.id,
      label: profile.full_name || profile.email || "Usuario",
      role: profile.role
    })),
    contacts: (contacts || []) as Array<{ id: string; full_name: string; email: string | null; client_id: string }>,
    stakeholders: (stakeholders || []) as Array<{ id: string; full_name: string; organization: string | null }>
  };
}

export { firstRelation };
