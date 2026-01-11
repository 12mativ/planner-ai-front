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

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface ProjectTask {
  id: string;
  taskNumber: number;
  title: string;
  status: string;
}

interface CreateTaskPageFormProps {
  teamId: string;
  projectId: string;
  teamMembers: TeamMember[];
  projectTasks: ProjectTask[];
}

export function CreateTaskPageForm({
  teamId,
  projectId,
  teamMembers,
  projectTasks,
}: CreateTaskPageFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    assigneeIds: [] as string[],
    observerIds: [] as string[],
    parentId: "" as string | undefined,
    relatedTaskIds: [] as string[],
  });

  // Format tasks for select options
  const taskOptions = projectTasks.map((task) => ({
    id: task.id,
    name: `#${task.taskNumber} - ${task.title}`,
    email: task.status, // Using email field to show status
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${teamId}/projects/${projectId}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при создании задачи");
      }

      toast.success("Задача успешно создана");
      router.push(`/dashboard/teams/${teamId}/projects/${projectId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Ошибка при создании задачи"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div>
          <label
            htmlFor="parentId"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Родительская задача
          </label>
          <Select
            value={formData.parentId || "none"}
            onValueChange={(value) =>
              setFormData({ ...formData, parentId: value === "none" ? undefined : value })
            }
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите родительскую задачу" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Нет родительской задачи</SelectItem>
              {taskOptions.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Связанные задачи
          </label>
          <MultiSelect
            options={taskOptions}
            selected={formData.relatedTaskIds}
            onChange={(selected) =>
              setFormData({ ...formData, relatedTaskIds: selected })
            }
            placeholder="Выберите связанные задачи"
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Приоритет
          </label>
          <Select
            value={formData.priority}
            onValueChange={(value) =>
              setFormData({ ...formData, priority: value })
            }
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите приоритет" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Низкий</SelectItem>
              <SelectItem value="medium">Средний</SelectItem>
              <SelectItem value="high">Высокий</SelectItem>
              <SelectItem value="critical">Критический</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Исполнители
          </label>
          <MultiSelect
            options={teamMembers}
            selected={formData.assigneeIds}
            onChange={(selected) =>
              setFormData({ ...formData, assigneeIds: selected })
            }
            placeholder="Выберите исполнителей"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Наблюдатели
          </label>
          <MultiSelect
            options={teamMembers}
            selected={formData.observerIds}
            onChange={(selected) =>
              setFormData({ ...formData, observerIds: selected })
            }
            placeholder="Выберите наблюдателей"
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Создание..." : "Создать задачу"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/teams/${teamId}/projects/${projectId}`)
            }
            disabled={isLoading}
          >
            Отмена
          </Button>
        </div>
      </form>
    </div>
  );
}
