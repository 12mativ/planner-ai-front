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

interface CreateTaskFormProps {
  teamId: string;
  projectId: string;
  teamMembers: TeamMember[];
  onSuccess?: () => void;
}

export function CreateTaskForm({
  teamId,
  projectId,
  teamMembers,
  onSuccess,
}: CreateTaskFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    assigneeIds: [] as string[],
    observerIds: [] as string[],
  });

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
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        assigneeIds: [],
        observerIds: [],
      });
      setIsOpen(false);
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Ошибка при создании задачи"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>+ Создать задачу</Button>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Создать новую задачу
      </h3>
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
            rows={3}
            disabled={isLoading}
            className="resize-none max-h-40"
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

        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Создание..." : "Создать"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              setFormData({
                title: "",
                description: "",
                priority: "medium",
                assigneeIds: [],
                observerIds: [],
              });
            }}
            disabled={isLoading}
          >
            Отмена
          </Button>
        </div>
      </form>
    </div>
  );
}
