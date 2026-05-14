"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertInternalRole, getCurrentProfile, logActivity } from "@/lib/actions/helpers";
import { filtersToQuery, parseSearchFilters, type SearchFilters } from "@/lib/data/search-shared";

function filtersFromFormData(formData: FormData): SearchFilters {
  return parseSearchFilters({
    q: value(formData, "q"),
    entity: value(formData, "entity"),
    clientId: value(formData, "clientId"),
    userId: value(formData, "userId"),
    dateFrom: value(formData, "dateFrom"),
    dateTo: value(formData, "dateTo"),
    status: value(formData, "status"),
    priority: value(formData, "priority"),
    urgency: value(formData, "urgency"),
    category: value(formData, "category"),
    industryId: value(formData, "industryId"),
    interestId: value(formData, "interestId")
  });
}

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field.trim() : "";
}

export async function createSavedSearch(formData: FormData) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const name = value(formData, "name");
  if (!name) throw new Error("El nombre de la busqueda es obligatorio.");

  const filters = filtersFromFormData(formData);
  const hasFilters = Object.entries(filters).some(([key, current]) => key !== "entity" ? Boolean(current) : current !== "all");
  if (!hasFilters) throw new Error("Aplicá al menos un filtro antes de guardar la busqueda.");

  const { data, error } = await supabase
    .from("saved_searches")
    .insert({ user_id: user.id, name, filters })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await logActivity({
    supabase,
    actorId: user.id,
    action: "saved_search_created",
    entityType: "saved_search",
    entityId: data.id,
    metadata: { name }
  });

  revalidatePath("/search");
  redirect(`/search?${filtersToQuery(filters)}&toast=saved_search_created`);
}

export async function renameSavedSearch(id: string, formData: FormData) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const name = value(formData, "name");
  if (!name) throw new Error("El nombre de la busqueda es obligatorio.");

  const { error } = await supabase.from("saved_searches").update({ name }).eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);

  await logActivity({
    supabase,
    actorId: user.id,
    action: "saved_search_updated",
    entityType: "saved_search",
    entityId: id,
    metadata: { name }
  });

  revalidatePath("/search");
  redirect("/search?toast=saved_search_updated");
}

export async function deleteSavedSearch(id: string) {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const { error } = await supabase.from("saved_searches").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);

  await logActivity({
    supabase,
    actorId: user.id,
    action: "saved_search_deleted",
    entityType: "saved_search",
    entityId: id
  });

  revalidatePath("/search");
  redirect("/search?toast=saved_search_deleted");
}
