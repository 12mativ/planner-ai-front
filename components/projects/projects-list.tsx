"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsListProps {
  projects: Project[];
  teamId: string;
  canManage: boolean;
}

export function ProjectsList({ projects, teamId, canManage }: ProjectsListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (projectId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот проект?")) {
      return;
    }

    setDeletingId(projectId);

    try {
      const response = await fetch(`/api/teams/${teamId}/projects/${projectId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при удалении проекта");
      }

      toast.success("Проект успешно удален");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка при удалении проекта");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
            Активный
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Завершен
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            Архивирован
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

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <span className="text-2xl">📁</span>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          В команде пока нет проектов
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <div
          key={project.id}
          className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {project.name}
              </h3>
              <div className="mt-1">
                {getStatusBadge(project.status)}
              </div>
            </div>
          </div>

          {project.description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
              {project.description}
            </p>
          )}

          <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-3">
            Создан: {new Date(project.createdAt).toLocaleDateString("ru-RU")}
          </div>

          {canManage && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  // TODO: Navigate to project details page
                  toast.info("Страница проекта будет доступна в следующем обновлении");
                }}
              >
                Открыть
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 dark:text-red-400"
                onClick={() => handleDelete(project.id)}
                disabled={deletingId === project.id}
              >
                {deletingId === project.id ? "..." : "Удалить"}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
