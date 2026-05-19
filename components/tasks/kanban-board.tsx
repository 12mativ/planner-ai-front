"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
}

interface Task {
  id: string;
  taskNumber: number;
  title: string;
  priority: string;
  status: string;
  projectId: string;
  projectShortCode: string;
  projectName: string;
  teamId: string;
  assignees: User[];
}

interface KanbanBoardProps {
  tasks: Task[];
}

const COLUMNS = [
  { key: "todo", label: "К выполнению" },
  { key: "in_progress", label: "В работе" },
  { key: "done", label: "Выполнено" },
] as const;

type Status = (typeof COLUMNS)[number]["key"];

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  critical: "Критический",
};

const COLUMN_STYLES: Record<Status, string> = {
  todo: "border-zinc-200 dark:border-zinc-700",
  in_progress: "border-yellow-300 dark:border-yellow-700",
  done: "border-green-300 dark:border-green-700",
};

const COLUMN_HEADER_STYLES: Record<Status, string> = {
  todo: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  in_progress: "bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  done: "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

export function KanbanBoard({ tasks: initialTasks }: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [movingId, setMovingId] = useState<string | null>(null);
  const router = useRouter();

  const moveTask = async (task: Task, direction: "prev" | "next") => {
    const statuses: Status[] = ["todo", "in_progress", "done"];
    const currentIndex = statuses.indexOf(task.status as Status);
    const newIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0 || newIndex >= statuses.length) return;

    const newStatus = statuses[newIndex];
    setMovingId(task.id);

    try {
      const res = await fetch(
        `/api/teams/${task.teamId}/projects/${task.projectId}/tasks/${task.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) throw new Error();

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
      router.refresh();
    } catch {
      toast.error("Не удалось обновить статус задачи");
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNS.map((col, colIndex) => {
        const colTasks = tasks.filter((t) => t.status === col.key);

        return (
          <div
            key={col.key}
            className={`flex flex-col rounded-lg border-2 ${COLUMN_STYLES[col.key]}`}
          >
            {/* Column header */}
            <div className={`flex items-center justify-between rounded-t-md px-4 py-3 ${COLUMN_HEADER_STYLES[col.key]}`}>
              <span className="font-semibold">{col.label}</span>
              <span className="ml-2 rounded-full bg-white/60 px-2 py-0.5 text-xs font-bold dark:bg-black/20">
                {colTasks.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-1 flex-col gap-3 p-3">
              {colTasks.length === 0 && (
                <div className="flex flex-1 items-center justify-center py-8 text-sm text-zinc-400 dark:text-zinc-600">
                  Нет задач
                </div>
              )}
              {colTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <Link
                    href={`/dashboard/teams/${task.teamId}/projects/${task.projectId}/tasks/${task.id}`}
                    className="mb-1 block text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {task.projectShortCode}-{task.taskNumber}: {task.title}
                  </Link>

                  <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {task.projectName}
                  </p>

                  <div className="mb-3 flex flex-wrap gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[task.priority] ?? "bg-zinc-100 text-zinc-600"}`}>
                      {PRIORITY_LABELS[task.priority] ?? task.priority}
                    </span>
                    {task.assignees.length > 0 && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {task.assignees.map((a) => a.name).join(", ")}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-1">
                    {colIndex > 0 && (
                      <button
                        onClick={() => moveTask(task, "prev")}
                        disabled={movingId === task.id}
                        className="flex-1 rounded border border-zinc-200 py-1 text-xs text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        ← Назад
                      </button>
                    )}
                    {colIndex < COLUMNS.length - 1 && (
                      <button
                        onClick={() => moveTask(task, "next")}
                        disabled={movingId === task.id}
                        className="flex-1 rounded border border-zinc-200 py-1 text-xs text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        Вперёд →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
