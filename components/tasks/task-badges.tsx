import { Badge } from "@/components/ui/badge";

export function TaskStatusBadge({ status }: { status: string }) {
  const variant = status === "completed" ? "success" : status === "cancelled" ? "warning" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

export function TaskPriorityBadge({ priority }: { priority: string }) {
  const variant = priority === "urgent" ? "danger" : priority === "high" ? "warning" : "muted";
  return <Badge variant={variant}>{priority}</Badge>;
}

export function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || status === "completed" || status === "cancelled") return false;
  return dueDate < new Date().toISOString().slice(0, 10);
}
