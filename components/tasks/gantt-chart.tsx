"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

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

interface GanttChartProps {
  tasks: Task[];
  projectShortCode: string;
  teamId: string;
  projectId: string;
}

export function GanttChart({ tasks, projectShortCode, teamId, projectId }: GanttChartProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  // Filter tasks that have dates
  const tasksWithDates = useMemo(() => {
    return tasks.filter((task) => task.startDate && task.endDate);
  }, [tasks]);

  // Calculate date range
  const dateRange = useMemo(() => {
    if (tasksWithDates.length === 0) {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      return { start: today, end: nextMonth };
    }

    const dates = tasksWithDates.flatMap((task) => [
      new Date(task.startDate!),
      new Date(task.endDate!),
    ]);

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Add padding
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);

    return { start: minDate, end: maxDate };
  }, [tasksWithDates]);

  // Generate timeline columns
  const timelineColumns = useMemo(() => {
    const columns: Date[] = [];
    const current = new Date(dateRange.start);
    current.setHours(0, 0, 0, 0);

    if (viewMode === "month") {
      current.setDate(1);
      while (current <= dateRange.end) {
        columns.push(new Date(current));
        current.setMonth(current.getMonth() + 1);
      }
    } else {
      // Week view
      const day = current.getDay();
      const diff = current.getDate() - day + (day === 0 ? -6 : 1);
      current.setDate(diff);

      while (current <= dateRange.end) {
        columns.push(new Date(current));
        current.setDate(current.getDate() + 7);
      }
    }

    return columns;
  }, [dateRange, viewMode]);

  const getTaskPosition = (task: Task) => {
    if (!task.startDate || !task.endDate) return null;

    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    const rangeStart = new Date(dateRange.start);
    const rangeEnd = new Date(dateRange.end);

    const totalDays =
      (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24);
    const startOffset =
      (start.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24);
    const duration =
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left: `${Math.max(0, left)}%`, width: `${Math.min(100 - left, width)}%` };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-zinc-400 dark:bg-zinc-600";
      case "in_progress":
        return "bg-yellow-500 dark:bg-yellow-600";
      case "done":
        return "bg-green-500 dark:bg-green-600";
      default:
        return "bg-zinc-400 dark:bg-zinc-600";
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case "low":
        return "border-l-4 border-l-gray-400";
      case "medium":
        return "border-l-4 border-l-blue-500";
      case "high":
        return "border-l-4 border-l-orange-500";
      case "critical":
        return "border-l-4 border-l-red-600";
      default:
        return "border-l-4 border-l-gray-400";
    }
  };

  const formatDate = (date: Date) => {
    if (viewMode === "month") {
      return date.toLocaleDateString("ru-RU", { month: "short", year: "numeric" });
    }
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  if (tasksWithDates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <span className="text-3xl">📊</span>
        </div>
        <p className="text-lg font-medium text-foreground mb-2">
          Нет задач с датами
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Добавьте даты начала и окончания к задачам, чтобы увидеть диаграмму Ганта
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setViewMode("week")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === "week"
              ? "bg-primary text-primary-foreground"
              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          }`}
        >
          По неделям
        </button>
        <button
          onClick={() => setViewMode("month")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === "month"
              ? "bg-primary text-primary-foreground"
              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          }`}
        >
          По месяцам
        </button>
      </div>

      {/* Gantt Chart */}
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
            <div className="w-64 p-3 font-semibold text-sm border-r border-zinc-200 dark:border-zinc-700">
              Задача
            </div>
            <div className="flex-1 flex">
              {timelineColumns.map((date, index) => (
                <div
                  key={index}
                  className="flex-1 p-3 text-center text-xs font-medium border-r border-zinc-200 dark:border-zinc-700 last:border-r-0"
                >
                  {formatDate(date)}
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {tasksWithDates.map((task) => {
              const position = getTaskPosition(task);
              return (
                <div
                  key={task.id}
                  className="flex hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  {/* Task Info */}
                  <div className="w-64 p-3 border-r border-zinc-200 dark:border-zinc-700">
                    <div className="text-sm font-medium text-foreground truncate">
                      {projectShortCode}-{task.taskNumber}
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                      {task.title}
                    </div>
                    {task.assignees.length > 0 && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-500 truncate mt-1">
                        {task.assignees[0].name}
                        {task.assignees.length > 1 && ` +${task.assignees.length - 1}`}
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="flex-1 relative p-2">
                    {position && (
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 h-8 rounded ${getStatusColor(
                          task.status
                        )} ${getPriorityBorder(task.priority)} shadow-sm cursor-pointer hover:opacity-80 transition-opacity`}
                        style={{
                          left: position.left,
                          width: position.width,
                        }}
                        title={`${task.title}\n${new Date(task.startDate!).toLocaleDateString("ru-RU")} - ${new Date(task.endDate!).toLocaleDateString("ru-RU")}\nНажмите, чтобы открыть`}
                        onClick={() => router.push(`/dashboard/teams/${teamId}/projects/${projectId}/tasks/${task.id}`)}
                      >
                        <div className="px-2 py-1 text-xs text-white font-medium truncate">
                          {task.title}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">Статус:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-zinc-400 dark:bg-zinc-600"></div>
            <span className="text-zinc-600 dark:text-zinc-400">К выполнению</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span className="text-zinc-600 dark:text-zinc-400">В работе</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-zinc-600 dark:text-zinc-400">Выполнено</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">Приоритет:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 border-l-4 border-l-gray-400 bg-zinc-200 dark:bg-zinc-700"></div>
            <span className="text-zinc-600 dark:text-zinc-400">Низкий</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 border-l-4 border-l-blue-500 bg-zinc-200 dark:bg-zinc-700"></div>
            <span className="text-zinc-600 dark:text-zinc-400">Средний</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 border-l-4 border-l-orange-500 bg-zinc-200 dark:bg-zinc-700"></div>
            <span className="text-zinc-600 dark:text-zinc-400">Высокий</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 border-l-4 border-l-red-600 bg-zinc-200 dark:bg-zinc-700"></div>
            <span className="text-zinc-600 dark:text-zinc-400">Критический</span>
          </div>
        </div>
      </div>
    </div>
  );
}
