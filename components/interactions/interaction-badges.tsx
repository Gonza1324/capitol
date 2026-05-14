import { Badge } from "@/components/ui/badge";

export function InteractionTypeBadge({ type }: { type: string }) {
  const variant = type === "call" || type === "in_person_meeting" ? "success" : type === "important_email" || type === "whatsapp" ? "warning" : "muted";
  return <Badge variant={variant}>{type}</Badge>;
}

export function formatInteractionDate(date: string | null, start?: string | null, end?: string | null) {
  if (!date) return "-";
  const formatted = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${date}T00:00:00`));
  const time = [start, end].filter(Boolean).join(" - ");
  return time ? `${formatted} ${time}` : formatted;
}
