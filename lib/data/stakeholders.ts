import { createClient } from "@/lib/supabase/server";

export async function getStakeholderOptions() {
  const supabase = await createClient();
  const [{ data: clients }, { data: topics }] = await Promise.all([
    supabase.from("clients").select("id, name").is("deleted_at", null).order("name"),
    supabase.from("topics").select("id, name").eq("is_active", true).order("name")
  ]);

  return {
    clients: (clients || []) as Array<{ id: string; name: string }>,
    topics: (topics || []) as Array<{ id: string; name: string }>
  };
}
