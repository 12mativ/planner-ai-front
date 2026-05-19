/**
 * AI Planner Utility
 * Handles communication with Python AI Planner backend service
 */

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ProjectContext {
  projectName: string;
  projectDescription: string;
  shortCode: string;
  teamSize: number;
}

interface GeneratedTask {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  estimatedHours?: number;
  suggestedAssignees: string[]; // User IDs
  dependencies: number[]; // Task indices in the array
  tags: string[];
}

interface GeneratedPlan {
  tasks: GeneratedTask[];
  reasoning: string;
  estimatedTotalHours?: number;
}

// Python backend URL
const AI_PLANNER_BASE_URL = process.env.AI_PLANNER_URL || "http://127.0.0.1:5000";

export interface ExistingTask {
  title: string;
  description: string;
  priority: string;
  status: string;
}

export async function generateProjectPlan(params: {
  projectDescription: string;
  teamMembers: TeamMember[];
  projectContext: ProjectContext;
  additionalContext?: string;
  existingTasks?: ExistingTask[];
}): Promise<GeneratedPlan> {
  const { projectDescription, teamMembers, projectContext, additionalContext, existingTasks } = params;

  try {
    const response = await fetch(`${AI_PLANNER_BASE_URL}/api/ai-planner/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectDescription,
        teamMembers,
        projectContext,
        additionalContext,
        existingTasks,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(
        `AI Planner service error: ${error.error || response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.success || !data.plan) {
      throw new Error("Некорректный ответ от AI Planner service");
    }

    const plan: GeneratedPlan = data.plan;

    // Валидация структуры плана
    if (!plan.tasks || !Array.isArray(plan.tasks)) {
      throw new Error("Некорректная структура плана: отсутствует массив задач");
    }

    // Валидация каждой задачи
    for (const task of plan.tasks) {
      if (!task.title || !task.description) {
        throw new Error("Некорректная задача: отсутствует title или description");
      }
      if (!["low", "medium", "high", "critical"].includes(task.priority)) {
        task.priority = "medium"; // Значение по умолчанию
      }
      if (!Array.isArray(task.suggestedAssignees)) {
        task.suggestedAssignees = [];
      }
      if (!Array.isArray(task.dependencies)) {
        task.dependencies = [];
      }
      if (!Array.isArray(task.tags)) {
        task.tags = [];
      }
    }

    return plan;
  } catch (error) {
    console.error("Error generating project plan:", error);
    throw error;
  }
}

export async function refineProjectPlan(params: {
  currentPlan: GeneratedPlan;
  refinementPrompt: string;
  conversationHistory: Array<{ role: string; content: string }>;
  teamMembers: TeamMember[];
  projectContext: ProjectContext;
  existingTasks?: ExistingTask[];
}): Promise<GeneratedPlan> {
  const { currentPlan, refinementPrompt, conversationHistory, teamMembers, projectContext, existingTasks } = params;

  try {
    const response = await fetch(`${AI_PLANNER_BASE_URL}/api/ai-planner/refine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPlan,
        refinementPrompt,
        conversationHistory,
        teamMembers,
        projectContext,
        existingTasks,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(
        `AI Planner service error: ${error.error || response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.success || !data.plan) {
      throw new Error("Некорректный ответ от AI Planner service");
    }

    const plan: GeneratedPlan = data.plan;

    // Валидация
    if (!plan.tasks || !Array.isArray(plan.tasks)) {
      throw new Error("Некорректная структура плана");
    }

    return plan;
  } catch (error) {
    console.error("Error refining project plan:", error);
    throw error;
  }
}

export interface WorkerTask {
  title: string;
  estimatedHours: number;
  priority: string;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  availableHoursPerWeek: number;
  currentTasks: WorkerTask[];
}

export interface TaskToAssign {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  priority: string;
  tags: string[];
}

export interface Assignment {
  taskId: string;
  workerId: string;
  workerName: string;
  reasoning: string;
}

export interface AssignResult {
  assignments: Assignment[];
  reasoning: string;
}

export async function assignTasks(params: {
  workers: Worker[];
  tasksToAssign: TaskToAssign[];
}): Promise<AssignResult> {
  const response = await fetch(`${AI_PLANNER_BASE_URL}/api/ai-planner/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`AI Planner service error: ${error.error || response.statusText}`);
  }

  const data = await response.json();

  if (!data.success || !data.result) {
    throw new Error("Некорректный ответ от AI Planner service");
  }

  return data.result as AssignResult;
}

export type { TeamMember, ProjectContext, GeneratedTask, GeneratedPlan };
