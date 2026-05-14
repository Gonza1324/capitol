import { Badge } from "@/components/ui/badge";

export function TaskStatusBadge({ status }: { status: string }) {
  const variant = status === "completed" ? "success" : status === "blocked" || status === "cancelled" ? "warning" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

export function TaskPriorityBadge({ priority }: { priority: string }) {
  const className =
    priority === "urgent"
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
      : priority === "high"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
        : "";

  return <Badge variant={priority === "urgent" || priority === "high" ? "outline" : "muted"} className={className}>{priority}</Badge>;
}

export function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || status === "completed" || status === "cancelled") return false;
  return dueDate < new Date().toISOString().slice(0, 10);
}
