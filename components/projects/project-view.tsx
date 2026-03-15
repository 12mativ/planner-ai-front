"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TasksList } from "@/components/tasks/tasks-list";
import { GanttChart } from "@/components/tasks/gantt-chart";
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
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
  author: User;
  assignees: User[];
  observers: User[];
}

interface ProjectViewProps {
  tasks: Task[];
  teamId: string;
  projectId: string;
  projectShortCode: string;
  currentUserId: string;
  canManage: boolean;
  totalTasks: number;
}

export function ProjectView({
  tasks,
  teamId,
  projectId,
  projectShortCode,
  currentUserId,
  canManage,
  totalTasks,
}: ProjectViewProps) {
  const [viewMode, setViewMode] = useState<"list" | "gantt">("list");

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-foreground">
            Задачи проекта ({totalTasks})
          </h2>
          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-foreground"
              }`}
            >
              📋 Список
            </button>
            <button
              onClick={() => setViewMode("gantt")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === "gantt"
                  ? "bg-white dark:bg-zinc-700 text-foreground shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-foreground"
              }`}
            >
              📊 Диаграмма Ганта
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          {canManage && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/teams/${teamId}/projects/${projectId}/ai-planner`}>
                🤖 AI Планировщик
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href={`/dashboard/teams/${teamId}/projects/${projectId}/tasks/new`}>
              + Создать задачу
            </Link>
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <TasksList
          tasks={tasks}
          teamId={teamId}
          projectId={projectId}
          projectShortCode={projectShortCode}
          currentUserId={currentUserId}
          canManage={canManage}
        />
      ) : (
        <GanttChart tasks={tasks} projectShortCode={projectShortCode} teamId={teamId} projectId={projectId} />
      )}
    </div>
  );
}
