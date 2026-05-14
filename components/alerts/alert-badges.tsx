import { Badge } from "@/components/ui/badge";

export function AlertCategoryBadge({ category }: { category: string }) {
  return <Badge variant="muted">{category}</Badge>;
}

export function AlertUrgencyBadge({ urgency }: { urgency: string }) {
  const variant = urgency === "critical" ? "danger" : urgency === "high" ? "warning" : "secondary";
  return <Badge variant={variant}>{urgency}</Badge>;
}
