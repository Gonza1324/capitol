import { firstRelation } from "@/lib/data/tasks";
import { createClient } from "@/lib/supabase/server";

export type ClientTimelineEvent = {
  id: string;
  type: "interaction" | "task" | "report" | "alert" | "document" | "stakeholder" | "activity";
  date: string;
  title: string;
  description: string | null;
  href: string | null;
  responsible: string | null;
  status: string | null;
  priority: string | null;
  clientName: string;
};

type ProfileRel = { full_name: string | null; email: string | null } | Array<{ full_name: string | null; email: string | null }> | null;

export async function getClientHistory(clientId: string, clientName: string) {
  const supabase = await createClient();
  const [
    { data: tasks },
    { data: interactions },
    { data: reports },
    { data: alerts },
    { data: documents },
    { data: stakeholders },
    { data: activity }
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, description, status, priority, due_date, completed_at, created_at, updated_at, profiles:created_by(full_name, email)")
      .eq("client_id", clientId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(50),
    supabase
      .from("interaction_clients")
      .select("interactions(id, title, type, interaction_date, summary, notes, next_steps, created_at, updated_at, profiles:created_by(full_name, email))")
      .eq("client_id", clientId)
      .is("interactions.deleted_at", null)
      .limit(50),
    supabase
      .from("report_clients")
      .select("reports(id, title, type, status, topic, description, sent_at, updated_at, profiles:responsible_id(full_name, email))")
      .eq("client_id", clientId)
      .is("reports.deleted_at", null)
      .limit(50),
    supabase
      .from("alert_clients")
      .select("alerts(id, title, category, urgency, description, sent_at, updated_at, profiles:responsible_id(full_name, email))")
      .eq("client_id", clientId)
      .is("alerts.deleted_at", null)
      .limit(50),
    supabase
      .from("files")
      .select("id, name, description, document_type, source_type, created_at, updated_at, profiles:uploaded_by(full_name, email)")
      .eq("entity_type", "client")
      .eq("entity_id", clientId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("stakeholder_clients")
      .select("relationship_description, stakeholders(id, full_name, type, organization, title, updated_at)")
      .eq("client_id", clientId)
      .is("stakeholders.deleted_at", null)
      .limit(50),
    supabase
      .from("activity_log")
      .select("id, action, entity_type, entity_id, metadata, created_at, profiles:actor_id(full_name, email)")
      .eq("entity_type", "client")
      .eq("entity_id", clientId)
      .order("created_at", { ascending: false })
      .limit(50)
  ]);

  const events: ClientTimelineEvent[] = [];

  ((tasks || []) as Array<{
    id: string; title: string; description: string | null; status: string; priority: string; due_date: string | null; completed_at: string | null; created_at: string; updated_at: string; profiles: ProfileRel;
  }>).forEach((task) => {
    events.push({
      id: `task-${task.id}`,
      type: "task",
      date: task.completed_at || task.updated_at || task.due_date || task.created_at,
      title: task.title,
      description: task.description,
      href: `/tasks/${task.id}`,
      responsible: profileLabel(task.profiles),
      status: task.status,
      priority: task.priority,
      clientName
    });
  });

  ((interactions || []) as Array<{ interactions: unknown }>).forEach((row) => {
    const interaction = firstRelation(row.interactions as {
      id: string; title: string; type: string; interaction_date: string | null; summary: string | null; notes: string | null; next_steps: string | null; created_at: string; updated_at: string; profiles: ProfileRel;
    } | Array<{
      id: string; title: string; type: string; interaction_date: string | null; summary: string | null; notes: string | null; next_steps: string | null; created_at: string; updated_at: string; profiles: ProfileRel;
    }> | null);
    if (!interaction) return;
    events.push({
      id: `interaction-${interaction.id}`,
      type: "interaction",
      date: interaction.interaction_date || interaction.updated_at || interaction.created_at,
      title: interaction.title,
      description: interaction.summary || interaction.next_steps || interaction.notes,
      href: `/interactions/${interaction.id}`,
      responsible: profileLabel(interaction.profiles),
      status: interaction.type,
      priority: null,
      clientName
    });
  });

  ((reports || []) as Array<{ reports: unknown }>).forEach((row) => {
    const report = firstRelation(row.reports as {
      id: string; title: string; type: string; status: string; topic: string | null; description: string | null; sent_at: string | null; updated_at: string; profiles: ProfileRel;
    } | Array<{
      id: string; title: string; type: string; status: string; topic: string | null; description: string | null; sent_at: string | null; updated_at: string; profiles: ProfileRel;
    }> | null);
    if (!report) return;
    events.push({
      id: `report-${report.id}`,
      type: "report",
      date: report.sent_at || report.updated_at,
      title: report.title,
      description: report.topic || report.description,
      href: `/reports/${report.id}`,
      responsible: profileLabel(report.profiles),
      status: report.status,
      priority: report.type,
      clientName
    });
  });

  ((alerts || []) as Array<{ alerts: unknown }>).forEach((row) => {
    const alert = firstRelation(row.alerts as {
      id: string; title: string; category: string; urgency: string; description: string | null; sent_at: string | null; updated_at: string; profiles: ProfileRel;
    } | Array<{
      id: string; title: string; category: string; urgency: string; description: string | null; sent_at: string | null; updated_at: string; profiles: ProfileRel;
    }> | null);
    if (!alert) return;
    events.push({
      id: `alert-${alert.id}`,
      type: "alert",
      date: alert.sent_at || alert.updated_at,
      title: alert.title,
      description: alert.description,
      href: `/alerts/${alert.id}`,
      responsible: profileLabel(alert.profiles),
      status: alert.category,
      priority: alert.urgency,
      clientName
    });
  });

  ((documents || []) as Array<{ id: string; name: string; description: string | null; document_type: string; source_type: string; created_at: string; updated_at: string; profiles: ProfileRel }>).forEach((document) => {
    events.push({
      id: `document-${document.id}`,
      type: "document",
      date: document.created_at || document.updated_at,
      title: document.name,
      description: document.description,
      href: `/documents/${document.id}`,
      responsible: profileLabel(document.profiles),
      status: document.document_type,
      priority: document.source_type,
      clientName
    });
  });

  ((stakeholders || []) as Array<{ relationship_description: string | null; stakeholders: unknown }>).forEach((row) => {
    const stakeholder = firstRelation(row.stakeholders as { id: string; full_name: string; type: string; organization: string | null; title: string | null; updated_at: string } | Array<{ id: string; full_name: string; type: string; organization: string | null; title: string | null; updated_at: string }> | null);
    if (!stakeholder) return;
    events.push({
      id: `stakeholder-${stakeholder.id}`,
      type: "stakeholder",
      date: stakeholder.updated_at,
      title: stakeholder.full_name,
      description: row.relationship_description || [stakeholder.organization, stakeholder.title].filter(Boolean).join(" / ") || null,
      href: `/stakeholders/${stakeholder.id}`,
      responsible: null,
      status: stakeholder.type,
      priority: null,
      clientName
    });
  });

  ((activity || []) as Array<{ id: string; action: string; created_at: string; profiles: ProfileRel }>).forEach((item) => {
    events.push({
      id: `activity-${item.id}`,
      type: "activity",
      date: item.created_at,
      title: item.action,
      description: "Cambio registrado en la ficha del cliente",
      href: null,
      responsible: profileLabel(item.profiles),
      status: null,
      priority: null,
      clientName
    });
  });

  return events
    .filter((event) => Boolean(event.date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 80);
}

function profileLabel(profileRel: ProfileRel) {
  const profile = firstRelation(profileRel);
  return profile?.full_name || profile?.email || null;
}
