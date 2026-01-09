"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewTeamPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Название команды обязательно");
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
        setError(data.error || "Ошибка при создании команды");
        return;
      }

      // Redirect to teams list after successful creation
      router.push("/dashboard/teams");
      router.refresh();
    } catch (error) {
      console.error("Create team error:", error);
      setError("Произошла ошибка при создании команды");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div>
          <Link
            href="/dashboard/teams"
            className="text-sm font-medium text-zinc-600 hover:text-foreground dark:text-zinc-400"
          >
            ← Назад к командам
          </Link>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground">
            Создать команду
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Создайте новую команду и добавьте участников
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-foreground"
              >
                Название команды *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-foreground placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder-zinc-500"
                placeholder="Например: Команда разработки"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-foreground"
              >
                Описание
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-foreground placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder-zinc-500"
                placeholder="Краткое описание команды и её целей"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-lg bg-foreground px-4 py-3 text-base font-medium text-background transition-all hover:scale-[1.02] hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-200"
            >
              {isLoading ? "Создание..." : "Создать команду"}
            </button>
            <Link
              href="/dashboard/teams"
              className="flex-1 rounded-lg border-2 border-foreground px-4 py-3 text-center text-base font-medium text-foreground transition-all hover:scale-[1.02] hover:bg-foreground hover:text-background"
            >
              Отмена
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
