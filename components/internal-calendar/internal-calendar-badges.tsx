import { Badge } from "@/components/ui/badge";

export function InternalCalendarTypeBadge({ type }: { type: string }) {
  const variant = type === "task_deadline" ? "warning" : type === "reminder" ? "secondary" : "muted";
  return <Badge variant={variant}>{type}</Badge>;
}

export function InternalCalendarStatusBadge({ status }: { status: string }) {
  const variant = status === "completed" ? "success" : status === "cancelled" ? "danger" : status === "postponed" ? "warning" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

export function InternalCalendarSourceBadge({ source }: { source: string }) {
  return <Badge variant={source === "google" ? "secondary" : "muted"}>{source}</Badge>;
}
