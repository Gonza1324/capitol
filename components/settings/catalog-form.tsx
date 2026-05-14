"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { catalogItemSchema } from "@/lib/validators/client";

export function CatalogForm({
  kind,
  action
}: {
  kind: "industry" | "interest";
  action: (kind: "industry" | "interest", values: { name: string }) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<{ name: string }>({
    resolver: zodResolver(catalogItemSchema),
    defaultValues: { name: "" }
  });

  function onSubmit(values: { name: string }) {
    setSubmitError(null);
    startTransition(async () => {
      try {
        await action(kind, values);
      } catch (error) {
        const digest = typeof error === "object" && error && "digest" in error ? String(error.digest) : "";
        if (digest.startsWith("NEXT_REDIRECT")) throw error;
        setSubmitError(error instanceof Error ? error.message : "No pudimos guardar.");
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-2">
        <Label>{kind === "industry" ? "Nuevo rubro" : "Nuevo interes"}</Label>
        <Input {...form.register("name")} placeholder={kind === "industry" ? "Energia" : "Regulacion"} />
        {form.formState.errors.name ? <p className="text-xs text-destructive">{form.formState.errors.name.message}</p> : null}
      </div>
      {submitError ? <Badge variant="warning">{submitError}</Badge> : null}
      <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : "Agregar"}</Button>
    </form>
  );
}
