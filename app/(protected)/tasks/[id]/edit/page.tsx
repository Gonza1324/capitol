import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { TaskForm } from "@/components/forms/task-form";
import { PageHeader } from "@/components/page-header";
import { updateTaskRecord } from "@/lib/actions/tasks";
import { getTaskFormOptions } from "@/lib/data/tasks";
import { createClient } from "@/lib/supabase/server";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: task }, { data: assignees }, options] = await Promise.all([
    supabase.from("tasks").select("*").eq("id", id).is("deleted_at", null).maybeSingle(),
    supabase.from("task_assignees").select("user_id").eq("task_id", id),
    getTaskFormOptions()
  ]);

  if (!task) notFound();
  const taskValue = task as typeof task & {
    origin_type?: string | null;
    origin_id?: string | null;
    recurrence_rule?: "daily" | "weekly" | "monthly" | "custom" | null;
  };

  return (
    <>
      <PageHeader title={`Editar ${taskValue.title}`} />
      <Card>
        <CardContent className="pt-6">
          <TaskForm
            action={updateTaskRecord.bind(null, id)}
            task={{
              ...taskValue,
              assignee_ids: ((assignees || []) as Array<{ user_id: string }>).map((item) => item.user_id),
              initial_comment: ""
            }}
            clients={options.clients}
            profiles={options.profiles}
          />
        </CardContent>
      </Card>
    </>
  );
}
