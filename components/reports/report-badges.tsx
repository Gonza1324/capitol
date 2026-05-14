import { Badge } from "@/components/ui/badge";

export function ReportTypeBadge({ type }: { type: string }) {
  return <Badge variant="muted">{type}</Badge>;
}

export function ReportStatusBadge({ status }: { status: string }) {
  const variant = status === "sent" || status === "approved" ? "success" : status === "in_review" ? "warning" : status === "archived" ? "muted" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}
