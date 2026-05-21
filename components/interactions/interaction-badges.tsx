import { Badge } from "@/components/ui/badge";

export function formatInteractionType(type: string) {
  const labels: Record<string, string> = {
    call: "Llamada",
    in_person_meeting: "Reunión presencial",
    important_email: "Email importante",
    whatsapp: "WhatsApp",
    lunch: "Almuerzo",
    presentation: "Presentación",
    stakeholder_meeting: "Reunión con contacto externo",
    internal_meeting: "Reunión interna",
    other: "Otro"
  };
  return labels[type] || type;
}

export function InteractionTypeBadge({ type }: { type: string }) {
  const variant = type === "call" || type === "in_person_meeting" ? "info" : type === "important_email" || type === "whatsapp" ? "warning" : "muted";
  return <Badge variant={variant}>{formatInteractionType(type)}</Badge>;
}

export function formatInteractionDate(date: string | null, start?: string | null, end?: string | null) {
  if (!date) return "-";
  const formatted = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${date}T00:00:00`));
  const time = [start, end].filter(Boolean).join(" - ");
  return time ? `${formatted} ${time}` : formatted;
}
