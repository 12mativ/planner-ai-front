"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Assignment {
  taskId: string;
  workerId: string;
  workerName: string;
  reasoning: string;
}

interface AssignResult {
  assignments: Assignment[];
  reasoning: string;
}

interface AiAssignDialogProps {
  teamId: string;
  projectId: string;
  tasks: { id: string; title: string }[];
}

export function AiAssignDialog({ teamId, projectId, tasks }: AiAssignDialogProps) {
  const taskTitleMap = new Map(tasks.map((t) => [t.id, t.title]));
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<AssignResult | null>(null);
  const router = useRouter();

  const runAssignment = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(
        `/api/teams/${teamId}/projects/${projectId}/ai-assign`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка AI");
      setResult(data.result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка AI назначения");
    } finally {
      setLoading(false);
    }
  };

  const applyAssignments = async () => {
    if (!result) return;
    setApplying(true);
    let failed = 0;
    for (const a of result.assignments) {
      try {
        const res = await fetch(
          `/api/teams/${teamId}/projects/${projectId}/tasks/${a.taskId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assigneeIds: [a.workerId] }),
          }
        );
        if (!res.ok) failed++;
      } catch {
        failed++;
      }
    }
    setApplying(false);
    if (failed === 0) {
      toast.success("Исполнители назначены успешно");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(`Не удалось назначить ${failed} задач(и)`);
    }
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">AI Назначение</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Назначение задач</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          AI проанализирует участников команды и их текущую загрузку, затем назначит
          незадействованные задачи наиболее подходящим исполнителям.
        </p>

        {!result && (
          <Button onClick={runAssignment} disabled={loading} className="w-full">
            {loading ? "Анализируем..." : "Запустить AI назначение"}
          </Button>
        )}

        {result && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Назначения ({result.assignments.length})
              </p>
              {result.assignments.map((a) => (
                <div
                  key={a.taskId}
                  className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
                >
                  <p className="text-sm font-medium text-foreground mb-0.5">
                    {taskTitleMap.get(a.taskId) ?? a.taskId}
                  </p>
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">
                    → {a.workerName}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{a.reasoning}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={runAssignment}
                disabled={loading || applying}
              >
                {loading ? "Анализируем..." : "Пересчитать"}
              </Button>
              <Button
                className="flex-1"
                onClick={applyAssignments}
                disabled={applying || loading}
              >
                {applying ? "Применяем..." : "Применить назначения"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
