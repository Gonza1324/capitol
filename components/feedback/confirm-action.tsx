"use client";

import { useTransition } from "react";
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

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        startTransition(async () => {
          await action();
        });
      }}
    >
      {isPending ? "Procesando..." : label}
    </Button>
  );
}
