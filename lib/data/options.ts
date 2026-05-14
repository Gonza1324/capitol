import { createClient } from "@/lib/supabase/server";

export async function getFormOptions() {
  const supabase = await createClient();
  const [{ data: industries }, { data: interests }, { data: profiles }] = await Promise.all([
    supabase.from("industries").select("id, name").eq("is_active", true).order("name"),
    supabase.from("interests").select("id, name").eq("is_active", true).order("name"),
    supabase.from("profiles").select("id, full_name, email, role").in("role", ["admin", "partner_director", "analyst", "assistant"]).order("full_name")
  ]);

  return {
    industries: (industries || []) as Array<{ id: string; name: string }>,
    interests: (interests || []) as Array<{ id: string; name: string }>,
    profiles: ((profiles || []) as Array<{ id: string; full_name: string | null; email: string | null; role: string }>).map((profile) => ({
      id: profile.id,
      label: profile.full_name || profile.email || "Usuario sin nombre",
      role: profile.role
    }))
  };
}

export async function getCurrentProfileWithPermissions() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase.from("profiles").select("id, role, full_name, email").eq("id", user.id).maybeSingle();
  return {
    user,
    profile: profile as { id: string; role: string; full_name: string | null; email: string | null } | null
  };
}
