import { Badge } from "@/components/ui/badge";

export const taskStatusLabels: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En Proceso",
  in_review: "En Revisión",
  completed: "Completada",
  cancelled: "Cancelada"
};

export function formatTaskStatus(status: string) {
  return taskStatusLabels[status] || status;
}

export const taskPriorityLabels: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente"
};

export function formatTaskPriority(priority: string) {
  return taskPriorityLabels[priority] || priority;
}

export function TaskStatusBadge({ status }: { status: string }) {
  const variant = status === "completed" ? "success" : status === "cancelled" ? "warning" : "secondary";
  return <Badge variant={variant}>{formatTaskStatus(status)}</Badge>;
}

export function TaskPriorityBadge({ priority }: { priority: string }) {
  const variant = priority === "urgent" ? "danger" : priority === "high" ? "warning" : "muted";
  return <Badge variant={variant}>{formatTaskPriority(priority)}</Badge>;
}

export function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || status === "completed" || status === "cancelled") return false;
  return dueDate < new Date().toISOString().slice(0, 10);
}
