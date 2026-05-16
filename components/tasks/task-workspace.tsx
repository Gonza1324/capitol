"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";
import { Archive, ArrowDown, ArrowUp, ArrowUpDown, Check, Eye, KanbanSquare, List, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { archiveTaskRecord, changeTaskPriority, changeTaskStatus } from "@/lib/actions/tasks";
import { taskPriorities, taskStatuses, type TaskPriority, type TaskStatus } from "@/lib/validators/task";
import { formatTaskPriority, formatTaskStatus, isOverdue, TaskPriorityBadge, TaskStatusBadge } from "./task-badges";

export type TaskListRow = {
  id: string;
  title: string;
  description: string | null;
  client_id: string | null;
  client_name: string | null;
  status: TaskStatus;
  priority: string;
  due_date: string | null;
  created_by_name: string | null;
  updated_at: string;
  assignees: { id: string; label: string }[];
};

type Filters = {
  status: string;
  priority: string;
  clientId: string;
  assigneeId: string;
  date: string;
  special: "" | "overdue" | "mine" | "unassigned";
};

type SortConfig = {
  key: "due_date" | "priority";
  direction: "asc" | "desc";
} | null;

export function TaskWorkspace({
  tasks,
  clients,
  profiles,
  currentUserId
}: {
  tasks: TaskListRow[];
  clients: { id: string; name: string }[];
  profiles: { id: string; label: string }[];
  currentUserId: string;
}) {
  const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({ status: "", priority: "", clientId: "", assigneeId: "", date: "", special: "" });

  const filteredTasks = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const haystack = [task.title, task.description, task.client_name, ...task.assignees.map((item) => item.label)].filter(Boolean).join(" ").toLowerCase();
      return (
        (!needle || haystack.includes(needle)) &&
        (!filters.status || task.status === filters.status) &&
        (!filters.priority || task.priority === filters.priority) &&
        (!filters.clientId || task.client_id === filters.clientId) &&
        (!filters.assigneeId || task.assignees.some((assignee) => assignee.id === filters.assigneeId)) &&
        (!filters.date || task.due_date === filters.date) &&
        (filters.special !== "overdue" || isOverdue(task.due_date, task.status)) &&
        (filters.special !== "mine" || task.assignees.some((assignee) => assignee.id === currentUserId)) &&
        (filters.special !== "unassigned" || task.assignees.length === 0)
      );
    });
  }, [currentUserId, filters, search, tasks]);

  const emptyMessage = getEmptyMessage(tasks.length, filteredTasks.length, filters.special);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-3 lg:grid-cols-7">
        <Input className="md:col-span-3 lg:col-span-2" placeholder="Buscar por titulo, descripcion, cliente..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <FilterSelect label="Estado" value={filters.status} options={taskStatuses.map((status) => ({ label: formatTaskStatus(status), value: status }))} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} />
        <FilterSelect label="Prioridad" value={filters.priority} options={taskPriorities.map((priority) => ({ label: formatTaskPriority(priority), value: priority }))} onChange={(value) => setFilters((current) => ({ ...current, priority: value }))} />
        <FilterSelect label="Cliente" value={filters.clientId} options={clients.map((client) => ({ label: client.name, value: client.id }))} onChange={(value) => setFilters((current) => ({ ...current, clientId: value }))} />
        <FilterSelect label="Responsable" value={filters.assigneeId} options={profiles.map((profile) => ({ label: profile.label, value: profile.id }))} onChange={(value) => setFilters((current) => ({ ...current, assigneeId: value }))} />
        <Input type="date" value={filters.date} onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))} />
        <div className="flex flex-wrap gap-2 md:col-span-3 lg:col-span-7">
          <Button type="button" variant={filters.special === "mine" ? "default" : "outline"} size="sm" onClick={() => setFilters((current) => ({ ...current, special: current.special === "mine" ? "" : "mine" }))}>
            Mis tareas
          </Button>
          <Button type="button" variant={filters.special === "overdue" ? "default" : "outline"} size="sm" onClick={() => setFilters((current) => ({ ...current, special: current.special === "overdue" ? "" : "overdue" }))}>
            Vencidas
          </Button>
          <Button type="button" variant={filters.special === "unassigned" ? "default" : "outline"} size="sm" onClick={() => setFilters((current) => ({ ...current, special: current.special === "unassigned" ? "" : "unassigned" }))}>
            Sin responsable
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => { setSearch(""); setFilters({ status: "", priority: "", clientId: "", assigneeId: "", date: "", special: "" }); }}>
            Limpiar filtros
          </Button>
          <div className="ml-auto flex gap-2">
            <Button type="button" variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => setView("list")}><List className="h-4 w-4" /> Lista</Button>
            <Button type="button" variant={view === "kanban" ? "default" : "outline"} size="sm" onClick={() => setView("kanban")}><KanbanSquare className="h-4 w-4" /> Kanban</Button>
          </div>
        </div>
      </div>

      {view === "list" ? <TaskTable tasks={filteredTasks} emptyMessage={emptyMessage} /> : <TaskKanban tasks={filteredTasks} emptyMessage={emptyMessage} />}
    </div>
  );
}

function TaskTable({ tasks, emptyMessage }: { tasks: TaskListRow[]; emptyMessage: string }) {
  const [isPending, startTransition] = useTransition();
  const [sort, setSort] = useState<SortConfig>(null);
  const sortedTasks = useMemo(() => sortTasks(tasks, sort), [sort, tasks]);

  const toggleSort = useCallback((key: "due_date" | "priority") => {
    setSort((current) => {
      if (current?.key === key) return { key, direction: current.direction === "asc" ? "desc" : "asc" };
      return { key, direction: key === "priority" ? "desc" : "asc" };
    });
  }, []);

  const columns = useMemo<ColumnDef<TaskListRow>[]>(
    () => [
      {
        header: "Titulo",
        cell: ({ row }) => (
          <div className="min-w-[32rem] max-w-3xl">
            <Link href={`/tasks/${row.original.id}`} className="font-medium hover:underline">{row.original.title}</Link>
            <p className="mt-1 text-xs text-muted-foreground">{row.original.client_name || "Sin cliente"}</p>
            {isOverdue(row.original.due_date, row.original.status) ? <p className="mt-1 text-xs text-destructive">Vencida</p> : null}
          </div>
        )
      },
      { header: "Estado", cell: ({ row }) => <TaskStatusSelect task={row.original} /> },
      {
        id: "priority",
        header: () => <SortableHeader label="Prioridad" active={sort?.key === "priority"} direction={sort?.direction} onClick={() => toggleSort("priority")} />,
        cell: ({ row }) => <TaskPrioritySelect task={row.original} />
      },
      { header: "Responsables", cell: ({ row }) => <BadgeList values={row.original.assignees.map((item) => item.label)} empty="Sin responsable" /> },
      {
        id: "due_date",
        header: () => <SortableHeader label="Fecha limite" active={sort?.key === "due_date"} direction={sort?.direction} onClick={() => toggleSort("due_date")} />,
        cell: ({ row }) => row.original.due_date || "-"
      },
      {
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="icon" title="Ver detalle" aria-label="Ver detalle"><Link href={`/tasks/${row.original.id}`}><Eye className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline" size="icon" title="Editar" aria-label="Editar"><Link href={`/tasks/${row.original.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button>
            {row.original.status !== "completed" ? (
              <Button size="icon" variant="outline" title="Completar" aria-label="Completar" disabled={isPending} onClick={() => startTransition(async () => { await changeTaskStatus(row.original.id, "completed", row.original.client_id, "/tasks?toast=task_completed"); })}>
                <Check className="h-4 w-4" />
              </Button>
            ) : null}
            <Button size="icon" variant="outline" title="Archivar" aria-label="Archivar" disabled={isPending} onClick={() => {
              if (!window.confirm(`Archivar ${row.original.title}?`)) return;
              startTransition(async () => { await archiveTaskRecord(row.original.id, row.original.client_id, "/tasks?toast=task_archived"); });
            }}>
              <Archive className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    ],
    [isPending, sort, toggleSort]
  );
  const table = useReactTable({ data: sortedTasks, columns, getCoreRowModel: getCoreRowModel() });

  if (!tasks.length) return <EmptyState message={emptyMessage} />;

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50 text-left">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => <th key={header.id} className="px-4 py-3 font-medium">{flexRender(header.column.columnDef.header, header.getContext())}</th>)}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b align-top last:border-0">
              {row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortableHeader({
  label,
  active,
  direction,
  onClick
}: {
  label: string;
  active: boolean;
  direction?: "asc" | "desc";
  onClick: () => void;
}) {
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <button type="button" className="inline-flex items-center gap-1.5 rounded-sm font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={onClick}>
      <span>{label}</span>
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function sortTasks(tasks: TaskListRow[], sort: SortConfig) {
  if (!sort) return tasks;
  const direction = sort.direction === "asc" ? 1 : -1;
  return [...tasks].sort((a, b) => {
    if (sort.key === "priority") {
      const priorityDiff = priorityRank(a.priority) - priorityRank(b.priority);
      if (priorityDiff) return priorityDiff * direction;
      return a.title.localeCompare(b.title);
    }

    if (!a.due_date && !b.due_date) return a.title.localeCompare(b.title);
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;

    const dateDiff = dueDateRank(a.due_date) - dueDateRank(b.due_date);
    if (dateDiff) return dateDiff * direction;
    return a.title.localeCompare(b.title);
  });
}

function priorityRank(priority: string) {
  const ranks: Record<string, number> = { low: 1, medium: 2, high: 3, urgent: 4 };
  return ranks[priority] || 0;
}

function dueDateRank(value: string | null) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  return new Date(`${value}T00:00:00`).getTime();
}

function TaskStatusSelect({ task }: { task: TaskListRow }) {
  const [isPending, startTransition] = useTransition();
  return (
    <select
      className={`h-9 min-w-36 rounded-md border px-2 text-xs font-medium ${taskStatusSelectClass(task.status)}`}
      value={task.status}
      disabled={isPending}
      aria-label={`Cambiar estado de ${task.title}`}
      onChange={(event) => startTransition(async () => {
        await changeTaskStatus(task.id, event.target.value as TaskStatus, task.client_id, "/tasks?toast=task_status_changed");
      })}
    >
      {taskStatuses.map((status) => <option key={status} value={status}>{formatTaskStatus(status)}</option>)}
    </select>
  );
}

function taskStatusSelectClass(status: string) {
  const classes: Record<string, string> = {
    pending: "border-border bg-muted text-muted-foreground",
    in_progress: "border-info/25 bg-info-muted text-info",
    in_review: "border-warning/25 bg-warning-muted text-warning",
    completed: "border-success/25 bg-success-muted text-success",
    cancelled: "border-danger/25 bg-danger-muted text-danger"
  };
  return classes[status] || "border-border bg-background text-foreground";
}

function TaskPrioritySelect({ task }: { task: TaskListRow }) {
  const [isPending, startTransition] = useTransition();
  return (
    <select
      className={`h-9 min-w-28 rounded-md border px-2 text-xs font-medium ${taskPrioritySelectClass(task.priority)}`}
      value={task.priority}
      disabled={isPending}
      aria-label={`Cambiar prioridad de ${task.title}`}
      onChange={(event) => startTransition(async () => {
        await changeTaskPriority(task.id, event.target.value as TaskPriority, task.client_id, "/tasks?toast=task_updated");
      })}
    >
      {taskPriorities.map((priority) => <option key={priority} value={priority}>{formatTaskPriority(priority)}</option>)}
    </select>
  );
}

function taskPrioritySelectClass(priority: string) {
  const classes: Record<string, string> = {
    low: "border-border bg-muted text-muted-foreground",
    medium: "border-info/25 bg-info-muted text-info",
    high: "border-warning/25 bg-warning-muted text-warning",
    urgent: "border-danger/25 bg-danger-muted text-danger"
  };
  return classes[priority] || "border-border bg-background text-foreground";
}

function TaskKanban({ tasks, emptyMessage }: { tasks: TaskListRow[]; emptyMessage: string }) {
  if (!tasks.length) return <EmptyState message={emptyMessage} />;
  return (
    <div className="grid gap-4 xl:grid-cols-5">
      {taskStatuses.map((status) => {
        const statusTasks = tasks.filter((task) => task.status === status);
        return (
          <div key={status} className="min-h-64 rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <TaskStatusBadge status={status} />
              <Badge variant="muted">{statusTasks.length}</Badge>
            </div>
            <div className="space-y-3 p-3">
              {statusTasks.map((task) => <TaskCard key={task.id} task={task} />)}
              {!statusTasks.length ? <p className="text-xs text-muted-foreground">Sin tareas</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskCard({ task }: { task: TaskListRow }) {
  const [isPending, startTransition] = useTransition();
  return (
    <div className={`rounded-md border p-3 ${isOverdue(task.due_date, task.status) ? "border-destructive/50" : ""}`}>
      <Link href={`/tasks/${task.id}`} className="text-sm font-medium hover:underline">{task.title}</Link>
      <p className="mt-1 text-xs text-muted-foreground">{task.client_name || "Sin cliente"}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        <TaskPriorityBadge priority={task.priority} />
        {task.due_date ? <Badge variant={isOverdue(task.due_date, task.status) ? "warning" : "muted"}>{task.due_date}</Badge> : null}
      </div>
      <div className="mt-3">
        <BadgeList values={task.assignees.map((item) => item.label)} empty="Sin responsable" />
      </div>
      <select
        className="mt-3 h-9 w-full rounded-md border bg-background px-2 text-xs"
        value={task.status}
        disabled={isPending}
        onChange={(event) => startTransition(async () => {
          await changeTaskStatus(task.id, event.target.value as TaskStatus, task.client_id, "/tasks?toast=task_status_changed");
        })}
      >
        {taskStatuses.map((status) => <option key={status} value={status}>{formatTaskStatus(status)}</option>)}
      </select>
    </div>
  );
}

function BadgeList({ values, empty }: { values: string[]; empty: string }) {
  if (!values.length) return <span className="text-xs text-muted-foreground">{empty}</span>;
  return <div className="flex flex-wrap gap-1">{values.slice(0, 3).map((value) => <Badge key={value} variant="muted">{value}</Badge>)}{values.length > 3 ? <Badge variant="outline">+{values.length - 3}</Badge> : null}</div>;
}

function FilterSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: (string | { label: string; value: string })[];
  onChange: (value: string) => void;
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
      <option value="">{label}</option>
      {options.map((option) => {
        const item = typeof option === "string" ? { label: option, value: option } : option;
        return <option key={item.value} value={item.value}>{item.label}</option>;
      })}
    </select>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border bg-card p-8 text-center">
      <h2 className="text-base font-semibold">{message}</h2>
      <p className="mt-2 text-sm text-muted-foreground">Ajusta los filtros o crea una nueva tarea.</p>
      <Button asChild className="mt-4"><Link href="/tasks/new">Nueva tarea</Link></Button>
    </div>
  );
}

function getEmptyMessage(total: number, filtered: number, special: Filters["special"]) {
  if (!total) return "Todavia no hay tareas creadas";
  if (special === "mine" && !filtered) return "No hay tareas asignadas a mi";
  if (special === "overdue" && !filtered) return "No hay tareas vencidas";
  return "No hay resultados con los filtros actuales";
}
