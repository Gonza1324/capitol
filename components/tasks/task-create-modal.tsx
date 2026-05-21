"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { TaskForm } from "@/components/forms/task-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TaskFormValues } from "@/lib/validators/task";

type ClientOption = { id: string; name: string };
type ProfileOption = { id: string; label: string };

export function TaskCreateModal({
  action,
  clients,
  profiles,
  lockedClientId
}: {
  action: (values: TaskFormValues) => Promise<void>;
  clients: ClientOption[];
  profiles: ProfileOption[];
  lockedClientId?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Nueva tarea
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-4 py-8">
          <Card className="w-full max-w-4xl">
            <CardHeader className="flex flex-row items-center justify-between gap-4 border-b">
              <CardTitle>Nueva tarea</CardTitle>
              <Button type="button" variant="ghost" size="icon" aria-label="Cerrar" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-12rem)] overflow-y-auto pt-6">
              <TaskForm action={action} clients={clients} profiles={profiles} lockedClientId={lockedClientId} />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
