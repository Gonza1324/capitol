import { Badge } from "@/components/ui/badge";

export function StakeholderTypeBadge({ type }: { type: string }) {
  return <Badge variant="muted">{type}</Badge>;
}

export function StanceBadge({ stance }: { stance: string }) {
  const variant = stance === "ally" ? "success" : stance === "opponent" ? "danger" : "secondary";
  return <Badge variant={variant}>{stance}</Badge>;
}

export function InfluenceBadge({ level }: { level: string | null }) {
  const value = level || "medium";
  const variant = value === "critical" ? "danger" : value === "high" ? "warning" : "secondary";
  return <Badge variant={variant}>{value}</Badge>;
}

export function SensitivityBadge({ level }: { level: string | null }) {
  const value = level || "medium";
  const variant = value === "restricted" ? "danger" : value === "high" ? "warning" : "muted";
  return <Badge variant={variant}>{value}</Badge>;
}
