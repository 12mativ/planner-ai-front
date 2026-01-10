"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function NewTeamPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Название команды обязательно");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Ошибка при создании команды");
        return;
      }

      toast.success("Команда успешно создана!");
      // Redirect to teams list after successful creation
      router.push("/dashboard/teams");
      router.refresh();
    } catch (error) {
      console.error("Create team error:", error);
      toast.error("Произошла ошибка при создании команды");
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
            <Link href="/dashboard/teams">
              ← Назад к командам
            </Link>
          </Button>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground">
            Создать команду
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Создайте новую команду и добавьте участников
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
                Название команды *
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Команда разработки"
                className="mt-1"
              />
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
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание команды и её целей"
                className="mt-1"
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
              {isLoading ? "Создание..." : "Создать команду"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              size="lg"
              asChild
            >
              <Link href="/dashboard/teams">
                Отмена
              </Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
