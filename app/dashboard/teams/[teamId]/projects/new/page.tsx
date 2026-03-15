"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function NewProjectPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    shortCode: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.shortCode.trim()) {
      toast.error("Название и короткий код обязательны");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/teams/${resolvedParams.teamId}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Ошибка при создании проекта");
        return;
      }

      toast.success("Проект успешно создан!");
      router.push(`/dashboard/teams/${resolvedParams.teamId}`);
      router.refresh();
    } catch (error) {
      console.error("Create project error:", error);
      toast.error("Произошла ошибка при создании проекта");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div>
          <Button variant="link" className="text-zinc-600 dark:text-zinc-400 p-0" asChild>
            <Link href={`/dashboard/teams/${resolvedParams.teamId}`}>
              ← Назад к команде
            </Link>
          </Button>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground">
            Создать проект
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Создайте новый проект для вашей команды
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-foreground"
              >
                Название проекта *
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: Разработка веб-приложения"
                className="mt-1"
              />
            </div>

            <div>
              <label
                htmlFor="shortCode"
                className="block text-sm font-medium text-foreground"
              >
                Короткий код *
              </label>
              <Input
                id="shortCode"
                name="shortCode"
                type="text"
                required
                value={formData.shortCode}
                onChange={(e) => setFormData({ ...formData, shortCode: e.target.value.toUpperCase() })}
                placeholder="PROJ"
                maxLength={10}
                className="mt-1 uppercase"
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                Используется как префикс для задач (например, PROJ-1)
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-foreground"
              >
                Описание
              </label>
              <Textarea
                id="description"
                name="description"
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Краткое описание проекта и его целей"
                className="mt-1 resize-none max-h-40 overflow-y-auto"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
              size="lg"
            >
              {isLoading ? "Создание..." : "Создать проект"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              size="lg"
              asChild
            >
              <Link href={`/dashboard/teams/${resolvedParams.teamId}`}>
                Отмена
              </Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
