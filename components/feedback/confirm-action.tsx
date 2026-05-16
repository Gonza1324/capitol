"use client";

import { useTransition } from "react";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConfirmAction({
  action,
  label,
  confirmMessage,
  variant = "ghost"
}: {
  action: () => Promise<void>;
  label: string;
  confirmMessage: string;
  variant?: "ghost" | "outline" | "destructive";
}) {
  const [isPending, startTransition] = useTransition();
  const isArchive = label.toLowerCase().startsWith("archivar");

  return (
    <Button
      type="button"
      variant={isArchive ? "outline" : variant}
      size={isArchive ? "icon" : "sm"}
      title={label}
      aria-label={label}
      disabled={isPending}
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        startTransition(async () => {
          await action();
        });
      }}
    >
      {isArchive ? <Archive className="h-4 w-4" /> : isPending ? "Procesando..." : label}
    </Button>
  );
}
