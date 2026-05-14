import { Card, CardContent } from "@/components/ui/card";
import { TaskForm } from "@/components/forms/task-form";
import { PageHeader } from "@/components/page-header";
import { createTaskRecord } from "@/lib/actions/tasks";
import { getTaskFormOptions } from "@/lib/data/tasks";

export default async function NewTaskPage({
  searchParams
}: {
  searchParams: Promise<{ clientId?: string; originType?: string; originId?: string }>;
}) {
  const [params, options] = await Promise.all([searchParams, getTaskFormOptions()]);

  return (
    <>
      <PageHeader title="Nueva tarea" description="Crear tarea interna con responsables multiples." />
      <Card>
        <CardContent className="pt-6">
          <TaskForm
            action={async (values) => {
              "use server";
              await createTaskRecord(values);
            }}
            clients={options.clients}
            profiles={options.profiles}
            lockedClientId={params.clientId}
            task={{
              title: params.originType === "interaction" ? "Seguimiento de interaccion" : "",
              client_id: params.clientId || "",
              origin_type: params.originType || "",
              origin_id: params.originId || ""
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
