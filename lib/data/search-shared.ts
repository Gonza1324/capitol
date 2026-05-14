import type { Json } from "@/lib/supabase/types";

export const searchEntityTypes = ["all", "client", "contact", "task", "interaction", "report", "alert", "stakeholder", "document"] as const;
export type SearchEntityType = (typeof searchEntityTypes)[number];

export type SearchFilters = {
  q: string;
  entity: SearchEntityType;
  clientId: string;
  userId: string;
  dateFrom: string;
  dateTo: string;
  status: string;
  priority: string;
  urgency: string;
  category: string;
  industryId: string;
  interestId: string;
};

export type SearchOption = { id: string; label: string };

export type SavedSearch = {
  id: string;
  name: string;
  filters: SearchFilters;
  created_at: string;
  updated_at: string;
};

export type SearchResult = {
  id: string;
  entity: Exclude<SearchEntityType, "all">;
  title: string;
  subtitle: string;
  description: string | null;
  href: string;
  date: string | null;
  badges: string[];
  clientIds: string[];
  userIds: string[];
  status?: string | null;
  priority?: string | null;
  urgency?: string | null;
  category?: string | null;
  industryIds?: string[];
  interestIds?: string[];
  searchableText: string;
};

export type SearchData = {
  filters: SearchFilters;
  hasActiveSearch: boolean;
  results: SearchResult[];
  savedSearches: SavedSearch[];
  options: {
    clients: SearchOption[];
    users: SearchOption[];
    industries: SearchOption[];
    interests: SearchOption[];
  };
};

export const emptySearchFilters: SearchFilters = {
  q: "",
  entity: "all",
  clientId: "",
  userId: "",
  dateFrom: "",
  dateTo: "",
  status: "",
  priority: "",
  urgency: "",
  category: "",
  industryId: "",
  interestId: ""
};

type SearchParamsLike = Partial<Record<keyof SearchFilters, string | string[] | undefined>>;

export function parseSearchFilters(params: SearchParamsLike): SearchFilters {
  return {
    q: param(params.q),
    entity: searchEntityTypes.includes(param(params.entity) as SearchEntityType) ? (param(params.entity) as SearchEntityType) : "all",
    clientId: param(params.clientId),
    userId: param(params.userId),
    dateFrom: param(params.dateFrom),
    dateTo: param(params.dateTo),
    status: param(params.status),
    priority: param(params.priority),
    urgency: param(params.urgency),
    category: param(params.category),
    industryId: param(params.industryId),
    interestId: param(params.interestId)
  };
}

export function filtersToQuery(filters: SearchFilters) {
  const query = new URLSearchParams();
  Object.entries({ ...emptySearchFilters, ...filters }).forEach(([key, current]) => {
    if (key === "entity" && current === "all") return;
    if (current) query.set(key, current);
  });
  return query.toString();
}

export function normalizeSavedFilters(value: Json): SearchFilters {
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptySearchFilters;
  return parseSearchFilters(value as SearchParamsLike);
}

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}
