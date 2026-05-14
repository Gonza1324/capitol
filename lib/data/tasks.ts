import { createClient } from "@/lib/supabase/server";

export type TaskOptionClient = { id: string; name: string };
export type TaskOptionProfile = { id: string; label: string; role: string };

export async function getTaskFormOptions() {
  const supabase = await createClient();
  const [{ data: clients }, { data: profiles }] = await Promise.all([
    supabase.from("clients").select("id, name").is("deleted_at", null).order("name"),
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("role", ["admin", "partner_director", "analyst", "assistant"])
      .order("full_name")
  ]);

  return {
    clients: (clients || []) as TaskOptionClient[],
    profiles: ((profiles || []) as Array<{ id: string; full_name: string | null; email: string | null; role: string }>).map((profile) => ({
      id: profile.id,
      label: profile.full_name || profile.email || "Usuario",
      role: profile.role
    }))
  };
}

export function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] || null : value || null;
}
