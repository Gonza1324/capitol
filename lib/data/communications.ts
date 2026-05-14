import { createClient } from "@/lib/supabase/server";

export async function getCommunicationOptions() {
  const supabase = await createClient();
  const [{ data: clients }, { data: profiles }, { data: contacts }, { data: industries }, { data: interests }] = await Promise.all([
    supabase.from("clients").select("id, name").is("deleted_at", null).order("name"),
    supabase.from("profiles").select("id, full_name, email, role").in("role", ["admin", "partner_director", "analyst", "assistant"]).order("full_name"),
    supabase.from("contacts").select("id, full_name, email, client_id").is("deleted_at", null).order("full_name"),
    supabase.from("industries").select("id, name").eq("is_active", true).order("name"),
    supabase.from("interests").select("id, name").eq("is_active", true).order("name")
  ]);

  return {
    clients: (clients || []) as Array<{ id: string; name: string }>,
    profiles: ((profiles || []) as Array<{ id: string; full_name: string | null; email: string | null; role: string }>).map((profile) => ({
      id: profile.id,
      label: profile.full_name || profile.email || "Usuario",
      role: profile.role
    })),
    contacts: (contacts || []) as Array<{ id: string; full_name: string; email: string | null; client_id: string }>,
    industries: (industries || []) as Array<{ id: string; name: string }>,
    interests: (interests || []) as Array<{ id: string; name: string }>
  };
}
