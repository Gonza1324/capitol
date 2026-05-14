import { Badge } from "@/components/ui/badge";

export function DocumentTypeBadge({ type }: { type: string }) {
  return <Badge variant="muted">{type}</Badge>;
}

export function SourceTypeBadge({ sourceType }: { sourceType: string }) {
  return <Badge variant={sourceType === "upload" ? "success" : "secondary"}>{sourceType === "upload" ? "upload" : "external link"}</Badge>;
}
