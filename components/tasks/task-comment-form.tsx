"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { taskCommentSchema, type TaskCommentValues } from "@/lib/validators/task";

export function TaskCommentForm({ action }: { action: (values: TaskCommentValues) => Promise<void> }) {
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<TaskCommentValues>({
    resolver: zodResolver(taskCommentSchema),
    defaultValues: { body: "" }
  });

  function onSubmit(values: TaskCommentValues) {
    setSubmitError(null);
    startTransition(async () => {
      try {
        await action(values);
      } catch (error) {
        const digest = typeof error === "object" && error && "digest" in error ? String(error.digest) : "";
        if (digest.startsWith("NEXT_REDIRECT")) throw error;
        setSubmitError(error instanceof Error ? error.message : "No pudimos agregar el comentario.");
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <Textarea placeholder="Agregar comentario..." {...form.register("body")} />
      {form.formState.errors.body ? <p className="text-xs text-destructive">{form.formState.errors.body.message}</p> : null}
      {submitError ? <Badge variant="warning">{submitError}</Badge> : null}
      <Button type="submit" disabled={isPending}>{isPending ? "Agregando..." : "Agregar comentario"}</Button>
    </form>
  );
}
