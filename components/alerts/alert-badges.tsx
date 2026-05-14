import { Badge } from "@/components/ui/badge";

export function AlertCategoryBadge({ category }: { category: string }) {
  return <Badge variant="muted">{category}</Badge>;
}

export function AlertUrgencyBadge({ urgency }: { urgency: string }) {
  const className = urgency === "critical"
    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
    : urgency === "high"
      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
      : "";
  return <Badge variant={urgency === "critical" || urgency === "high" ? "outline" : "secondary"} className={className}>{urgency}</Badge>;
}
