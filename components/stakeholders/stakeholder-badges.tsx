import { Badge } from "@/components/ui/badge";

export function StakeholderTypeBadge({ type }: { type: string }) {
  return <Badge variant="muted">{type}</Badge>;
}

export function StanceBadge({ stance }: { stance: string }) {
  const variant = stance === "ally" ? "success" : stance === "opponent" ? "warning" : "secondary";
  return <Badge variant={variant}>{stance}</Badge>;
}

export function InfluenceBadge({ level }: { level: string | null }) {
  const value = level || "medium";
  const className = value === "critical"
    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
    : value === "high"
      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
      : "";
  return <Badge variant={value === "critical" || value === "high" ? "outline" : "secondary"} className={className}>{value}</Badge>;
}

export function SensitivityBadge({ level }: { level: string | null }) {
  const value = level || "medium";
  const className = value === "restricted"
    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
    : value === "high"
      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
      : "";
  return <Badge variant={value === "restricted" || value === "high" ? "outline" : "muted"} className={className}>{value}</Badge>;
}
