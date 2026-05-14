"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const messages: Record<string, string> = {
  client_created: "Cliente creado correctamente.",
  client_updated: "Cliente actualizado correctamente.",
  client_archived: "Cliente archivado.",
  contact_created: "Contacto creado correctamente.",
  contact_updated: "Contacto actualizado correctamente.",
  contact_archived: "Contacto archivado.",
  catalog_updated: "Configuracion actualizada correctamente.",
  task_created: "Tarea creada correctamente.",
  task_updated: "Tarea actualizada correctamente.",
  task_completed: "Tarea marcada como completada.",
  task_reopened: "Tarea reabierta.",
  task_status_changed: "Estado de tarea actualizado.",
  task_archived: "Tarea archivada.",
  task_comment_created: "Comentario agregado correctamente.",
  interaction_created: "Interaccion creada correctamente.",
  interaction_updated: "Interaccion actualizada correctamente.",
  interaction_archived: "Interaccion archivada.",
  interaction_task_created: "Tarea derivada creada correctamente.",
  report_created: "Reporte creado correctamente.",
  report_updated: "Reporte actualizado correctamente.",
  report_archived: "Reporte archivado.",
  report_sent: "Reporte marcado como enviado.",
  report_approved: "Reporte aprobado.",
  report_task_created: "Tarea de seguimiento creada.",
  alert_created: "Alerta creada correctamente.",
  alert_updated: "Alerta actualizada correctamente.",
  alert_archived: "Alerta archivada.",
  alert_task_created: "Tarea de seguimiento creada.",
  stakeholder_created: "Stakeholder creado correctamente.",
  stakeholder_updated: "Stakeholder actualizado correctamente.",
  stakeholder_archived: "Stakeholder archivado.",
  document_created: "Documento creado correctamente.",
  document_updated: "Documento actualizado correctamente.",
  document_archived: "Documento archivado.",
  user_created: "Usuario creado correctamente.",
  user_updated: "Usuario actualizado correctamente.",
  error: "No pudimos completar la accion."
};

export function ToastMessage({ code }: { code?: string }) {
  const [visible, setVisible] = useState(Boolean(code));

  useEffect(() => {
    setVisible(Boolean(code));
    if (!code) return;
    const timer = window.setTimeout(() => setVisible(false), 4200);
    return () => window.clearTimeout(timer);
  }, [code]);

  if (!code || !visible) return null;

  const isError = code === "error";
  const Icon = isError ? XCircle : CheckCircle2;

  return (
    <div
      className={cn(
        "fixed right-4 top-4 z-50 flex max-w-sm items-center gap-3 rounded-md border bg-card px-4 py-3 text-sm shadow-lg",
        isError ? "border-destructive text-destructive" : "border-border"
      )}
      role="status"
    >
      <Icon className="h-4 w-4" />
      <span>{messages[code] || messages.error}</span>
    </div>
  );
}
