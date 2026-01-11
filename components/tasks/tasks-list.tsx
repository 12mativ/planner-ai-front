"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Task {
  id: string;
  taskNumber: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  author: User;
  assignees: User[];
  observers: User[];
}

interface TasksListProps {
  tasks: Task[];
  teamId: string;
  projectId: string;
  projectShortCode: string;
  currentUserId: string;
  canManage: boolean;
}

export function TasksList({
  tasks,
  teamId,
  projectId,
  projectShortCode,
  currentUserId,
  canManage,
}: TasksListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (taskId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Вы уверены, что хотите удалить эту задачу?")) {
      return;
    }

    setDeletingId(taskId);

    try {
      const response = await fetch(
        `/api/teams/${teamId}/projects/${projectId}/tasks/${taskId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при удалении задачи");
      }

      toast.success("Задача успешно удалена");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Ошибка при удалении задачи"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            Низкий
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Средний
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            Высокий
          </span>
        );
      case "critical":
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
            Критический
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            {priority}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "todo":
        return (
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            К выполнению
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            В работе
          </span>
        );
      case "done":
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
            Выполнено
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            {status}
          </span>
        );
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <span className="text-2xl">📋</span>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          В проекте пока нет задач
        </p>
      </div>
    );
  }

  const canDeleteTask = (task: Task) => {
    return canManage || task.author.id === currentUserId;
  };

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <Link
                href={`/dashboard/teams/${teamId}/projects/${projectId}/tasks/${task.id}`}
                className="block mb-2"
              >
                <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline decoration-2 underline-offset-4">
                  {projectShortCode}-{task.taskNumber}: {task.title}
                </h3>
              </Link>
              <div className="flex flex-wrap gap-2">
                {getPriorityBadge(task.priority)}
                {getStatusBadge(task.status)}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-500 mb-3">
            <div>
              <span className="font-medium">Автор:</span> {task.author.name}
            </div>
            {task.assignees.length > 0 && (
              <div>
                <span className="font-medium">Исполнители:</span>{" "}
                {task.assignees.map((a) => a.name).join(", ")}
              </div>
            )}
            {task.observers.length > 0 && (
              <div>
                <span className="font-medium">Наблюдатели:</span>{" "}
                {task.observers.map((o) => o.name).join(", ")}
              </div>
            )}
            <div>
              <span className="font-medium">Создана:</span>{" "}
              {new Date(task.createdAt).toLocaleDateString("ru-RU")}
            </div>
          </div>

          {canDeleteTask(task) && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 dark:text-red-400"
                onClick={(e) => handleDelete(task.id, e)}
                disabled={deletingId === task.id}
              >
                {deletingId === task.id ? "..." : "Удалить"}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
