"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
}

interface RelatedTask {
  id: string;
  taskNumber: number;
  title: string;
  status?: string;
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
  parent?: RelatedTask | null;
  subtasks?: RelatedTask[];
  relatedTasks?: RelatedTask[];
}

interface ProjectTask {
  id: string;
  taskNumber: number;
  title: string;
  status: string;
}

interface TaskEditFormProps {
  task: Task;
  teamId: string;
  projectId: string;
  projectShortCode: string;
  teamMembers: User[];
  projectTasks: ProjectTask[];
  canEdit: boolean;
  canDelete: boolean;
}

export function TaskEditForm({
  task,
  teamId,
  projectId,
  projectShortCode,
  teamMembers,
  projectTasks,
  canEdit,
  canDelete,
}: TaskEditFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    assigneeIds: task.assignees.map((a) => a.id),
    observerIds: task.observers.map((o) => o.id),
    parentId: task.parent?.id || (null as string | null),
    relatedTaskIds: task.relatedTasks?.map((t) => t.id) || ([] as string[]),
  });

  // Format tasks for select options (exclude current task)
  const taskOptions = projectTasks
    .filter((t) => t.id !== task.id)
    .map((t) => ({
      id: t.id,
      name: `#${t.taskNumber} - ${t.title}`,
      email: t.status, // Using email field to show status
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${teamId}/projects/${projectId}/tasks/${task.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при обновлении задачи");
      }

      toast.success("Задача успешно обновлена");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Ошибка при обновлении задачи"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить эту задачу?")) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${teamId}/projects/${projectId}/tasks/${task.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при удалении задачи");
      }

      toast.success("Задача успешно удалена");
      router.push(`/dashboard/teams/${teamId}/projects/${projectId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Ошибка при удалении задачи"
      );
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assigneeIds: task.assignees.map((a) => a.id),
      observerIds: task.observers.map((o) => o.id),
      parentId: task.parent?.id || null,
      relatedTaskIds: task.relatedTasks?.map((t) => t.id) || [],
    });
    setIsEditing(false);
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "low":
        return "Низкий";
      case "medium":
        return "Средний";
      case "high":
        return "Высокий";
      case "critical":
        return "Критический";
      default:
        return priority;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "todo":
        return "К выполнению";
      case "in_progress":
        return "В работе";
      case "done":
        return "Выполнено";
      default:
        return status;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content - Left Side */}
      <div className="lg:col-span-2 space-y-6">
        {/* Title and Description */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Заголовок *
                </label>
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Введите заголовок задачи"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Описание
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Введите описание задачи (необязательно)"
                  rows={6}
                  disabled={isLoading}
                  className="max-h-96 resize-y"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Сохранение..." : "Сохранить"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Отмена
                </Button>
              </div>
            </form>
          ) : (
            <div>
              <div className="mb-4">
                <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-2">
                  Создана: {new Date(task.createdAt).toLocaleString("ru-RU")} |
                  Обновлена: {new Date(task.updatedAt).toLocaleString("ru-RU")}
                </div>
                <h1 className="text-3xl font-bold text-foreground">
                  {projectShortCode}-{task.taskNumber}: {task.title}
                </h1>
              </div>

              {task.description ? (
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-base text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-500 italic">
                  Описание отсутствует
                </p>
              )}

              {canEdit && (
                <div className="mt-6 flex gap-3">
                  <Button onClick={() => setIsEditing(true)}>
                    Редактировать
                  </Button>
                  {canDelete && (
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                      onClick={handleDelete}
                      disabled={isLoading}
                    >
                      Удалить задачу
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Parent Task */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
            Родительская задача
          </h3>
          {isEditing ? (
            <Select
              value={formData.parentId || "none"}
              onValueChange={(value) =>
                setFormData({ ...formData, parentId: value === "none" ? null : value })
              }
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите родительскую задачу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Нет родительской задачи</SelectItem>
                {taskOptions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : task.parent ? (
            <div>
              <p className="text-sm font-medium text-foreground">
                #{task.parent.taskNumber} - {task.parent.title}
              </p>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-500 italic">
              Нет родительской задачи
            </p>
          )}
        </div>

        {/* Subtasks */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
              Подзадачи
            </h3>
            <div className="space-y-2">
              {task.subtasks.map((subtask) => (
                <div key={subtask.id}>
                  <p className="text-sm font-medium text-foreground">
                    #{subtask.taskNumber} - {subtask.title}
                  </p>
                  {subtask.status && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      {getStatusLabel(subtask.status)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Tasks */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
            Связанные задачи
          </h3>
          {isEditing ? (
            <MultiSelect
              options={taskOptions}
              selected={formData.relatedTaskIds}
              onChange={(selected) =>
                setFormData({ ...formData, relatedTaskIds: selected })
              }
              placeholder="Выберите связанные задачи"
              disabled={isLoading}
            />
          ) : task.relatedTasks && task.relatedTasks.length > 0 ? (
            <div className="space-y-2">
              {task.relatedTasks.map((relatedTask) => (
                <div key={relatedTask.id}>
                  <p className="text-sm font-medium text-foreground">
                    #{relatedTask.taskNumber} - {relatedTask.title}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-500 italic">
              Нет связанных задач
            </p>
          )}
        </div>
      </div>

      {/* Metadata - Right Side */}
      <div className="space-y-6">
        {/* Status */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
            Статус
          </h3>
          {isEditing ? (
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">К выполнению</SelectItem>
                <SelectItem value="in_progress">В работе</SelectItem>
                <SelectItem value="done">Выполнено</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-base font-medium text-foreground">
              {getStatusLabel(task.status)}
            </p>
          )}
        </div>

        {/* Priority */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
            Приоритет
          </h3>
          {isEditing ? (
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                setFormData({ ...formData, priority: value })
              }
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Низкий</SelectItem>
                <SelectItem value="medium">Средний</SelectItem>
                <SelectItem value="high">Высокий</SelectItem>
                <SelectItem value="critical">Критический</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-base font-medium text-foreground">
              {getPriorityLabel(task.priority)}
            </p>
          )}
        </div>

        {/* Author */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
            Автор
          </h3>
          <div>
            <p className="text-base font-medium text-foreground">
              {task.author.name}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              {task.author.email}
            </p>
          </div>
        </div>

        {/* Assignees */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
            Исполнители
          </h3>
          {isEditing ? (
            <MultiSelect
              options={teamMembers}
              selected={formData.assigneeIds}
              onChange={(selected) =>
                setFormData({ ...formData, assigneeIds: selected })
              }
              placeholder="Выберите исполнителей"
              disabled={isLoading}
            />
          ) : task.assignees.length > 0 ? (
            <div className="space-y-2">
              {task.assignees.map((assignee) => (
                <div key={assignee.id}>
                  <p className="text-sm font-medium text-foreground">
                    {assignee.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                    {assignee.email}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-500 italic">
              Не назначены
            </p>
          )}
        </div>

        {/* Observers */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
            Наблюдатели
          </h3>
          {isEditing ? (
            <MultiSelect
              options={teamMembers}
              selected={formData.observerIds}
              onChange={(selected) =>
                setFormData({ ...formData, observerIds: selected })
              }
              placeholder="Выберите наблюдателей"
              disabled={isLoading}
            />
          ) : task.observers.length > 0 ? (
            <div className="space-y-2">
              {task.observers.map((observer) => (
                <div key={observer.id}>
                  <p className="text-sm font-medium text-foreground">
                    {observer.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                    {observer.email}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-500 italic">
              Не назначены
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
