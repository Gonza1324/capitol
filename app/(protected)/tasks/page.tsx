import { PageHeader } from "@/components/page-header";
import { ToastMessage } from "@/components/feedback/toast-message";
import { TaskCreateModal } from "@/components/tasks/task-create-modal";
import { TaskWorkspace, type TaskListRow } from "@/components/tasks/task-workspace";
import { createTaskRecord } from "@/lib/actions/tasks";
import { createClient } from "@/lib/supabase/server";
import { firstRelation, getTaskFormOptions } from "@/lib/data/tasks";

type RawTask = {
  id: string;
  title: string;
  description: string | null;
  client_id: string | null;
  status: TaskListRow["status"];
  priority: string;
  due_date: string | null;
  created_by: string | null;
  updated_at: string;
  clients?: { name: string } | Array<{ name: string }> | null;
  task_assignees?: Array<{ profiles: { id: string; full_name: string | null; email: string | null } | Array<{ id: string; full_name: string | null; email: string | null }> | null }>;
};

export default async function TasksPage({
  searchParams
}: {
  searchParams: Promise<{ toast?: string }>;
}) {
  const [params, options] = await Promise.all([searchParams, getTaskFormOptions()]);
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      description,
      client_id,
      status,
      priority,
      due_date,
      created_by,
      updated_at,
      clients(name),
      task_assignees(profiles(id, full_name, email))
    `)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  const profileLabels = new Map(options.profiles.map((profile) => [profile.id, profile.label]));
  const tasks = ((data || []) as unknown as RawTask[]).map<TaskListRow>((task) => {
    const client = firstRelation(task.clients);
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      client_id: task.client_id,
      client_name: client?.name || null,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      created_by_name: task.created_by ? profileLabels.get(task.created_by) || null : null,
      updated_at: task.updated_at,
      assignees: (task.task_assignees || []).flatMap((item) => {
        const profile = firstRelation(item.profiles);
        return profile ? [{ id: profile.id, label: profile.full_name || profile.email || "Usuario" }] : [];
      })
    };
  });

  return (
    <>
      <ToastMessage code={params.toast} />
      <PageHeader
        title="Tareas"
        description="Gestion interna de pendientes, responsables y vencimientos."
        actions={
          <TaskCreateModal
            action={async (values) => {
              "use server";
              await createTaskRecord(values, "/tasks?toast=task_created");
            }}
            clients={options.clients}
            profiles={options.profiles}
          />
        }
      />
      <TaskWorkspace tasks={tasks} clients={options.clients} profiles={options.profiles} currentUserId={user?.id || ""} />
    </>
  );
}
