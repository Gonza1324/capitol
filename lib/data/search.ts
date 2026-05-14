/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { assertInternalRole, getCurrentProfile } from "@/lib/actions/helpers";
import { normalizeSavedFilters, type SearchData, type SearchFilters, type SearchResult } from "@/lib/data/search-shared";

export async function getGlobalSearchData(filters: SearchFilters): Promise<SearchData> {
  const { supabase, user, profile } = await getCurrentProfile();
  assertInternalRole(profile?.role);

  const [
    { data: clientOptions },
    { data: users },
    { data: industries },
    { data: interests },
    { data: savedSearchRows }
  ] = await Promise.all([
    supabase.from("clients").select("id, name").is("deleted_at", null).order("name"),
    supabase.from("profiles").select("id, full_name, email, role").in("role", ["admin", "partner_director", "analyst", "assistant"]).order("email"),
    supabase.from("industries").select("id, name").eq("is_active", true).order("name"),
    supabase.from("interests").select("id, name").eq("is_active", true).order("name"),
    supabase.from("saved_searches").select("id, name, filters, created_at, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false })
  ]);

  const options = {
    clients: ((clientOptions || []) as Array<{ id: string; name: string }>).map((item) => ({ id: item.id, label: item.name })),
    users: ((users || []) as Array<{ id: string; full_name: string | null; email: string | null }>).map((item) => ({ id: item.id, label: item.full_name || item.email || "Usuario" })),
    industries: ((industries || []) as Array<{ id: string; name: string }>).map((item) => ({ id: item.id, label: item.name })),
    interests: ((interests || []) as Array<{ id: string; name: string }>).map((item) => ({ id: item.id, label: item.name }))
  };

  const savedSearches = ((savedSearchRows || []) as Array<{ id: string; name: string; filters: Json; created_at: string; updated_at: string }>).map((item) => ({
    id: item.id,
    name: item.name,
    filters: normalizeSavedFilters(item.filters),
    created_at: item.created_at,
    updated_at: item.updated_at
  }));

  const hasActiveSearch = Object.entries(filters).some(([key, value]) => key !== "entity" ? Boolean(value) : value !== "all");
  const results = hasActiveSearch ? await getResults(supabase, filters) : [];

  return {
    filters,
    hasActiveSearch,
    results,
    savedSearches,
    options
  };
}

async function getResults(supabase: Awaited<ReturnType<typeof createClient>>, filters: SearchFilters) {
  const entity = filters.entity;
  const loaders = [
    entity === "all" || entity === "client" ? searchClients(supabase) : Promise.resolve([]),
    entity === "all" || entity === "contact" ? searchContacts(supabase) : Promise.resolve([]),
    entity === "all" || entity === "task" ? searchTasks(supabase) : Promise.resolve([]),
    entity === "all" || entity === "interaction" ? searchInteractions(supabase) : Promise.resolve([]),
    entity === "all" || entity === "report" ? searchReports(supabase) : Promise.resolve([]),
    entity === "all" || entity === "alert" ? searchAlerts(supabase) : Promise.resolve([]),
    entity === "all" || entity === "stakeholder" ? searchStakeholders(supabase) : Promise.resolve([]),
    entity === "all" || entity === "document" ? searchDocuments(supabase) : Promise.resolve([])
  ];
  const groups = await Promise.all(loaders);
  return groups
    .flat()
    .filter((result) => matchesFilters(result, filters))
    .map((result) => ({ result, score: scoreResult(result, filters.q) }))
    .sort((a, b) => b.score - a.score || new Date(b.result.date || 0).getTime() - new Date(a.result.date || 0).getTime())
    .slice(0, 80)
    .map((item) => item.result);
}

async function searchClients(supabase: Awaited<ReturnType<typeof createClient>>): Promise<SearchResult[]> {
  const { data } = await supabase
    .from("clients")
    .select("id, name, legal_name, tax_id, status, client_type, description, strategic_profile, website, drive_url, general_notes, updated_at, created_by, updated_by, client_industries(industry_id, industries(name)), client_interests(interest_id, priority, interests(name))")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(300);

  return ((data || []) as Array<any>).map((item) => {
    const industries = (item.client_industries || []).map((row: any) => row.industries?.name).filter(Boolean);
    const interests = (item.client_interests || []).map((row: any) => row.interests?.name).filter(Boolean);
    return {
      id: item.id,
      entity: "client",
      title: item.name,
      subtitle: [item.legal_name, item.tax_id].filter(Boolean).join(" · "),
      description: item.description || item.strategic_profile || item.general_notes,
      href: `/clients/${item.id}`,
      date: item.updated_at,
      badges: [item.status, item.client_type, ...industries.slice(0, 2), ...interests.slice(0, 2)].filter(Boolean),
      clientIds: [item.id],
      userIds: [item.created_by, item.updated_by].filter(Boolean),
      status: item.status,
      industryIds: (item.client_industries || []).map((row: any) => row.industry_id).filter(Boolean),
      interestIds: (item.client_interests || []).map((row: any) => row.interest_id).filter(Boolean),
      searchableText: searchable([item.name, item.legal_name, item.tax_id, item.description, item.strategic_profile, item.general_notes, item.website, item.drive_url, industries, interests])
    };
  });
}

async function searchContacts(supabase: Awaited<ReturnType<typeof createClient>>): Promise<SearchResult[]> {
  const { data } = await supabase
    .from("contacts")
    .select("id, client_id, first_name, last_name, full_name, title, email, whatsapp, linkedin_url, area, relationship_role, notes, updated_at, created_by, updated_by, clients(name)")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(300);

  return ((data || []) as Array<any>).map((item) => ({
    id: item.id,
    entity: "contact",
    title: item.full_name,
    subtitle: [item.title, first(item.clients)?.name, item.email].filter(Boolean).join(" · "),
    description: item.notes,
    href: `/clients/${item.client_id}`,
    date: item.updated_at,
    badges: [item.area, item.relationship_role].filter(Boolean),
    clientIds: [item.client_id].filter(Boolean),
    userIds: [item.created_by, item.updated_by].filter(Boolean),
    searchableText: searchable([item.full_name, item.first_name, item.last_name, item.title, item.email, item.whatsapp, item.linkedin_url, item.area, item.relationship_role, item.notes, first(item.clients)?.name])
  }));
}

async function searchTasks(supabase: Awaited<ReturnType<typeof createClient>>): Promise<SearchResult[]> {
  const { data } = await supabase
    .from("tasks")
    .select("id, title, description, client_id, status, priority, due_date, updated_at, created_by, updated_by, clients(name), task_assignees(user_id, profiles(full_name, email))")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(300);

  return ((data || []) as Array<any>).map((item) => {
    const assignees = (item.task_assignees || []).map((row: any) => first(row.profiles)?.full_name || first(row.profiles)?.email).filter(Boolean);
    return {
      id: item.id,
      entity: "task",
      title: item.title,
      subtitle: first(item.clients)?.name || "Sin cliente",
      description: item.description,
      href: `/tasks/${item.id}`,
      date: item.due_date || item.updated_at,
      badges: [item.status, item.priority, ...assignees.slice(0, 2)].filter(Boolean),
      clientIds: [item.client_id].filter(Boolean),
      userIds: [item.created_by, item.updated_by, ...(item.task_assignees || []).map((row: any) => row.user_id)].filter(Boolean),
      status: item.status,
      priority: item.priority,
      searchableText: searchable([item.title, item.description, item.status, item.priority, first(item.clients)?.name, assignees])
    };
  });
}

async function searchInteractions(supabase: Awaited<ReturnType<typeof createClient>>): Promise<SearchResult[]> {
  const { data } = await supabase
    .from("interactions")
    .select("id, type, title, description, interaction_date, location, summary, notes, decisions, risks, next_steps, created_by, updated_by, updated_at, interaction_clients(client_id, clients(name)), interaction_internal_participants(user_id, profiles(full_name, email))")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(300);

  return ((data || []) as Array<any>).map((item) => {
    const clients = (item.interaction_clients || []).map((row: any) => row.clients?.name).filter(Boolean);
    const participants = (item.interaction_internal_participants || []).map((row: any) => first(row.profiles)?.full_name || first(row.profiles)?.email).filter(Boolean);
    return {
      id: item.id,
      entity: "interaction",
      title: item.title,
      subtitle: [item.type, clients.join(", ")].filter(Boolean).join(" · "),
      description: item.summary || item.description || item.notes,
      href: `/interactions/${item.id}`,
      date: item.interaction_date || item.updated_at,
      badges: [item.type, ...clients.slice(0, 2)].filter(Boolean),
      clientIds: (item.interaction_clients || []).map((row: any) => row.client_id).filter(Boolean),
      userIds: [item.created_by, item.updated_by, ...(item.interaction_internal_participants || []).map((row: any) => row.user_id)].filter(Boolean),
      searchableText: searchable([item.title, item.description, item.summary, item.notes, item.decisions, item.risks, item.next_steps, item.location, item.type, clients, participants])
    };
  });
}

async function searchReports(supabase: Awaited<ReturnType<typeof createClient>>): Promise<SearchResult[]> {
  const { data } = await supabase
    .from("reports")
    .select("id, title, type, status, topic, description, sent_at, responsible_id, external_url, notes, updated_at, report_clients(client_id, clients(name))")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(300);

  return ((data || []) as Array<any>).map((item) => {
    const clients = (item.report_clients || []).map((row: any) => row.clients?.name).filter(Boolean);
    return {
      id: item.id,
      entity: "report",
      title: item.title,
      subtitle: [item.type, item.topic, clients.join(", ")].filter(Boolean).join(" · "),
      description: item.description || item.notes,
      href: `/reports/${item.id}`,
      date: item.sent_at || item.updated_at,
      badges: [item.type, item.status, item.topic].filter(Boolean),
      clientIds: (item.report_clients || []).map((row: any) => row.client_id).filter(Boolean),
      userIds: [item.responsible_id].filter(Boolean),
      status: item.status,
      searchableText: searchable([item.title, item.topic, item.description, item.notes, item.external_url, item.type, item.status, clients])
    };
  });
}

async function searchAlerts(supabase: Awaited<ReturnType<typeof createClient>>): Promise<SearchResult[]> {
  const { data } = await supabase
    .from("alerts")
    .select("id, title, category, urgency, description, content, sent_at, medium, responsible_id, attachment_url, notes, updated_at, alert_clients(client_id, clients(name)), alert_industries(industry_id), alert_interests(interest_id)")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(300);

  return ((data || []) as Array<any>).map((item) => {
    const clients = (item.alert_clients || []).map((row: any) => row.clients?.name).filter(Boolean);
    return {
      id: item.id,
      entity: "alert",
      title: item.title,
      subtitle: [item.category, item.medium, clients.join(", ")].filter(Boolean).join(" · "),
      description: item.description || item.content || item.notes,
      href: `/alerts/${item.id}`,
      date: item.sent_at || item.updated_at,
      badges: [item.category, item.urgency, item.medium].filter(Boolean),
      clientIds: (item.alert_clients || []).map((row: any) => row.client_id).filter(Boolean),
      userIds: [item.responsible_id].filter(Boolean),
      urgency: item.urgency,
      category: item.category,
      industryIds: (item.alert_industries || []).map((row: any) => row.industry_id).filter(Boolean),
      interestIds: (item.alert_interests || []).map((row: any) => row.interest_id).filter(Boolean),
      searchableText: searchable([item.title, item.description, item.content, item.notes, item.attachment_url, item.category, item.urgency, item.medium, clients])
    };
  });
}

async function searchStakeholders(supabase: Awaited<ReturnType<typeof createClient>>): Promise<SearchResult[]> {
  const { data } = await supabase
    .from("stakeholders")
    .select("id, full_name, organization, title, email, phone, linkedin_url, type, political_party, jurisdiction, influence_area, influence_level, sensitivity_level, notes, updated_at, stakeholder_clients(client_id, clients(name))")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(300);

  return ((data || []) as Array<any>).map((item) => {
    const clients = (item.stakeholder_clients || []).map((row: any) => row.clients?.name).filter(Boolean);
    return {
      id: item.id,
      entity: "stakeholder",
      title: item.full_name,
      subtitle: [item.organization, item.title, item.jurisdiction].filter(Boolean).join(" · "),
      description: item.notes,
      href: `/stakeholders/${item.id}`,
      date: item.updated_at,
      badges: [item.type, item.influence_level, item.sensitivity_level].filter(Boolean),
      clientIds: (item.stakeholder_clients || []).map((row: any) => row.client_id).filter(Boolean),
      userIds: [],
      searchableText: searchable([item.full_name, item.organization, item.title, item.email, item.phone, item.linkedin_url, item.type, item.political_party, item.jurisdiction, item.influence_area, item.notes, clients])
    };
  });
}

async function searchDocuments(supabase: Awaited<ReturnType<typeof createClient>>): Promise<SearchResult[]> {
  const { data } = await supabase
    .from("files")
    .select("id, name, description, file_url, external_url, document_type, source_type, entity_type, entity_id, uploaded_by, created_at, updated_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(300);

  return ((data || []) as Array<any>).map((item) => ({
    id: item.id,
    entity: "document",
    title: item.name,
    subtitle: `${item.entity_type} ${String(item.entity_id || "").slice(0, 8)}`,
    description: item.description,
    href: `/documents/${item.id}`,
    date: item.updated_at || item.created_at,
    badges: [item.document_type, item.source_type, item.entity_type].filter(Boolean),
    clientIds: item.entity_type === "client" ? [item.entity_id].filter(Boolean) : [],
    userIds: [item.uploaded_by].filter(Boolean),
    searchableText: searchable([item.name, item.description, item.external_url, item.file_url, item.document_type, item.source_type, item.entity_type])
  }));
}

function matchesFilters(result: SearchResult, filters: SearchFilters) {
  const needle = filters.q.trim().toLowerCase();
  if (needle && !result.searchableText.includes(needle)) return false;
  if (filters.clientId && !result.clientIds.includes(filters.clientId)) return false;
  if (filters.userId && !result.userIds.includes(filters.userId)) return false;
  if (filters.dateFrom && result.date && result.date < filters.dateFrom) return false;
  if (filters.dateTo && result.date && result.date > `${filters.dateTo}T23:59:59`) return false;
  if (filters.status && result.status !== filters.status) return false;
  if (filters.priority && result.priority !== filters.priority) return false;
  if (filters.urgency && result.urgency !== filters.urgency) return false;
  if (filters.category && result.category !== filters.category) return false;
  if (filters.industryId && !result.industryIds?.includes(filters.industryId)) return false;
  if (filters.interestId && !result.interestIds?.includes(filters.interestId)) return false;
  return true;
}

function scoreResult(result: SearchResult, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return 1;
  const title = result.title.toLowerCase();
  const subtitle = result.subtitle.toLowerCase();
  if (title === needle) return 100;
  if (title.startsWith(needle)) return 80;
  if (title.includes(needle)) return 60;
  if (subtitle.includes(needle)) return 40;
  return result.searchableText.includes(needle) ? 20 : 0;
}

function searchable(values: unknown[]) {
  return values.flatMap((value) => Array.isArray(value) ? value : [value]).filter(Boolean).join(" ").toLowerCase();
}

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
