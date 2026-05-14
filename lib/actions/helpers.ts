import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

const internalRoles: UserRole[] = ["admin", "partner_director", "analyst", "assistant"];

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  return { supabase, user, profile };
}

export function nullableString(value: FormDataEntryValue | null) {
  const stringValue = typeof value === "string" ? value.trim() : "";
  return stringValue.length ? stringValue : null;
}

export function assertInternalRole(role?: string | null) {
  if (!role || !internalRoles.includes(role as UserRole)) {
    throw new Error("No tenes permisos para operar este modulo.");
  }
}

export async function logActivity({
  supabase,
  actorId,
  action,
  entityType,
  entityId,
  metadata = {}
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await supabase.from("activity_log").insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata
  });
}
