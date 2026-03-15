"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface GeneratedTask {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  estimatedHours?: number;
  suggestedAssignees: string[];
  dependencies: number[];
  tags: string[];
}

interface GeneratedPlan {
  tasks: GeneratedTask[];
  reasoning: string;
  estimatedTotalHours?: number;
}

export default function AIPlanner({
  params,
}: {
  params: Promise<{ teamId: string; projectId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [step, setStep] = useState<"input" | "generating" | "preview">("input");
  const [prompt, setPrompt] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [editedTasks, setEditedTasks] = useState<GeneratedTask[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Пожалуйста, опишите проект");
      return;
    }

    setIsLoading(true);
    setStep("generating");

    try {
      const response = await fetch(
        `/api/teams/${resolvedParams.teamId}/projects/${resolvedParams.projectId}/ai-plan/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            additionalContext: additionalContext || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при генерации плана");
      }

      setGeneratedPlan(data.plan.generatedPlan);
      setEditedTasks(data.plan.generatedPlan.tasks);
      setPlanId(data.plan.id);
      setStep("preview");
      toast.success("План успешно сгенерирован!");
    } catch (error) {
      console.error("Error generating plan:", error);
      toast.error(
        error instanceof Error ? error.message : "Ошибка при генерации плана"
      );
      setStep("input");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!refinementPrompt.trim()) {
      toast.error("Введите запрос на уточнение");
      return;
    }

    if (!planId) {
      toast.error("План не найден");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${resolvedParams.teamId}/projects/${resolvedParams.projectId}/ai-plan/${planId}/refine`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refinementPrompt,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при уточнении плана");
      }

      setGeneratedPlan(data.plan.generatedPlan);
      setEditedTasks(data.plan.generatedPlan.tasks);
      setRefinementPrompt("");
      toast.success("План успешно обновлен!");
    } catch (error) {
      console.error("Error refining plan:", error);
      toast.error(
        error instanceof Error ? error.message : "Ошибка при уточнении плана"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!planId) {
      toast.error("План не найден");
      return;
    }

    if (
      !confirm(
        `Вы уверены, что хотите создать ${editedTasks.length} задач в проекте?`
      )
    ) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${resolvedParams.teamId}/projects/${resolvedParams.projectId}/ai-plan/${planId}/approve`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при утверждении плана");
      }

      toast.success(data.message);
      router.push(
        `/dashboard/teams/${resolvedParams.teamId}/projects/${resolvedParams.projectId}`
      );
      router.refresh();
    } catch (error) {
      console.error("Error approving plan:", error);
      toast.error(
        error instanceof Error ? error.message : "Ошибка при утверждении плана"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "critical":
        return "Критический";
      case "high":
        return "Высокий";
      case "medium":
        return "Средний";
      case "low":
        return "Низкий";
      default:
        return priority;
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div>
          <Button
            variant="link"
            className="p-0 text-zinc-600 dark:text-zinc-400"
            asChild
          >
            <Link
              href={`/dashboard/teams/${resolvedParams.teamId}/projects/${resolvedParams.projectId}`}
            >
              ← Назад к проекту
            </Link>
          </Button>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground">
            🤖 AI Планировщик
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Опишите проект, и AI автоматически разобьет его на задачи и
            распределит между участниками команды
          </p>
        </div>

        {/* Input Step */}
        {step === "input" && (
          <div className="space-y-6">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Описание проекта
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="prompt"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Что нужно реализовать? *
                  </label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Например: Создать веб-приложение для управления задачами с возможностью создания проектов, назначения исполнителей, отслеживания прогресса и генерации отчетов. Нужна аутентификация, роли пользователей и REST API."
                    rows={8}
                    className="resize-none max-h-60 overflow-y-auto"
                    disabled={isLoading}
                  />
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                    Опишите проект максимально подробно: функциональность,
                    технологии, требования
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="context"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Дополнительный контекст (опционально)
                  </label>
                  <Textarea
                    id="context"
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Например: Проект должен быть готов через 2 месяца. У нас есть 2 frontend разработчика и 1 backend. Приоритет - быстрый MVP."
                    rows={4}
                    className="resize-none max-h-40 overflow-y-auto"
                    disabled={isLoading}
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isLoading || !prompt.trim()}
                  size="lg"
                  className="w-full"
                >
                  {isLoading ? "Генерация плана..." : "🚀 Сгенерировать план"}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-900 dark:bg-indigo-900/20">
              <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                💡 Советы для лучших результатов
              </h3>
              <ul className="space-y-2 text-sm text-indigo-800 dark:text-indigo-200">
                <li>• Опишите функциональность проекта подробно</li>
                <li>• Укажите технологии и инструменты, если важно</li>
                <li>• Упомяните сроки и приоритеты</li>
                <li>• Добавьте информацию о команде и её навыках</li>
                <li>• После генерации вы сможете уточнить план</li>
              </ul>
            </div>
          </div>
        )}

        {/* Generating Step */}
        {step === "generating" && (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
            <h3 className="text-lg font-semibold text-foreground">
              AI анализирует проект...
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Это может занять 10-30 секунд
            </p>
          </div>
        )}

        {/* Preview Step */}
        {step === "preview" && generatedPlan && (
          <div className="space-y-6">
            {/* Plan Summary */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Сгенерированный план
              </h2>
              <div className="grid gap-4 sm:grid-cols-3 mb-4">
                <div className="rounded-lg bg-indigo-50 p-4 dark:bg-indigo-900/20">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {editedTasks.length}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Задач
                  </div>
                </div>
                {generatedPlan.estimatedTotalHours && (
                  <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {generatedPlan.estimatedTotalHours}ч
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      Оценка времени
                    </div>
                  </div>
                )}
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {
                      new Set(
                        editedTasks.flatMap((t) => t.suggestedAssignees)
                      ).size
                    }
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Участников
                  </div>
                </div>
              </div>

              {generatedPlan.reasoning && (
                <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Логика декомпозиции:
                  </h3>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                    {generatedPlan.reasoning}
                  </p>
                </div>
              )}
            </div>

            {/* Tasks List */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Задачи ({editedTasks.length})
              </h2>
              <div className="space-y-4">
                {editedTasks.map((task, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-mono text-zinc-500">
                            #{index + 1}
                          </span>
                          <h3 className="text-lg font-semibold text-foreground">
                            {task.title}
                          </h3>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                          {task.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {getPriorityLabel(task.priority)}
                      </span>
                      {task.estimatedHours && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          ⏱️ {task.estimatedHours}ч
                        </span>
                      )}
                      {task.dependencies.length > 0 && (
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          🔗 Зависит от: #{task.dependencies.join(", #")}
                        </span>
                      )}
                      {task.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Refinement Section */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Уточнить план
              </h2>
              <div className="space-y-4">
                <Textarea
                  value={refinementPrompt}
                  onChange={(e) => setRefinementPrompt(e.target.value)}
                  placeholder="Например: Добавь задачу по написанию документации. Увеличь приоритет задачи #3. Перераспредели задачи более равномерно."
                  rows={4}
                  className="resize-none max-h-40 overflow-y-auto"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleRefine}
                  disabled={isLoading || !refinementPrompt.trim()}
                  variant="outline"
                >
                  {isLoading ? "Обновление..." : "🔄 Уточнить план"}
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={handleApprove}
                disabled={isLoading}
                size="lg"
                className="flex-1"
              >
                ✅ Утвердить и создать задачи
              </Button>
              <Button
                onClick={() => {
                  setStep("input");
                  setGeneratedPlan(null);
                  setPlanId(null);
                  setEditedTasks([]);
                }}
                disabled={isLoading}
                variant="outline"
                size="lg"
              >
                Начать заново
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
