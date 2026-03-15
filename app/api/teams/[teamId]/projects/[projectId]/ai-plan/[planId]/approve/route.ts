import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { GeneratedPlan, GeneratedTask } from "@/lib/ai-planner";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; projectId: string; planId: string }> }
) {
  try {
    const session = await auth();
    const { teamId, projectId, planId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Check access
    const project = await prisma.project.findUnique({
      where: { id: projectId, teamId },
      include: {
        team: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
    }

    const { role, id: userId } = session.user;
    const isAdmin = role === "admin";
    const isTeamLead = project.team.leadId === userId;

    if (!isAdmin && !isTeamLead) {
      return NextResponse.json(
        { error: "Только тимлид или администратор может утверждать планы" },
        { status: 403 }
      );
    }

    // Get the plan
    const aiPlan = await prisma.aIPlan.findUnique({
      where: { id: planId, projectId },
    });

    if (!aiPlan) {
      return NextResponse.json({ error: "План не найден" }, { status: 404 });
    }

    if (aiPlan.status === "approved") {
      return NextResponse.json(
        { error: "План уже утвержден" },
        { status: 400 }
      );
    }

    const generatedPlan = aiPlan.generatedPlan as unknown as GeneratedPlan;

    // Get the next task number for this project
    const lastTask = await prisma.task.findFirst({
      where: { projectId },
      orderBy: { taskNumber: "desc" },
    });

    let nextTaskNumber = lastTask ? lastTask.taskNumber + 1 : 1;

    // Create tasks from the plan
    const createdTasks: any[] = [];
    const taskIdMap = new Map<number, string>(); // Map from array index to created task ID

    // First pass: create all tasks without dependencies
    for (let i = 0; i < generatedPlan.tasks.length; i++) {
      const taskData: GeneratedTask = generatedPlan.tasks[i];

      const task = await prisma.task.create({
        data: {
          taskNumber: nextTaskNumber++,
          title: taskData.title,
          description: taskData.description || "",
          projectId,
          authorId: userId,
          priority: taskData.priority,
          status: "todo",
        },
      });

      taskIdMap.set(i, task.id);
      createdTasks.push(task);

      // Assign suggested assignees
      if (taskData.suggestedAssignees && taskData.suggestedAssignees.length > 0) {
        await prisma.task.update({
          where: { id: task.id },
          data: {
            assignees: {
              connect: taskData.suggestedAssignees.map((userId) => ({ id: userId })),
            },
          },
        });
      }
    }

    // Second pass: set up dependencies (parent tasks)
    for (let i = 0; i < generatedPlan.tasks.length; i++) {
      const taskData: GeneratedTask = generatedPlan.tasks[i];
      const taskId = taskIdMap.get(i);

      if (!taskId) continue;

      // Set parent task if there's a dependency
      if (taskData.dependencies && taskData.dependencies.length > 0) {
        // Use the first dependency as parent
        const parentIndex = taskData.dependencies[0];
        const parentId = taskIdMap.get(parentIndex);

        if (parentId) {
          await prisma.task.update({
            where: { id: taskId },
            data: {
              parentId,
            },
          });
        }
      }

      // Set related tasks for other dependencies
      if (taskData.dependencies && taskData.dependencies.length > 1) {
        const relatedIds = taskData.dependencies
          .slice(1)
          .map((idx) => taskIdMap.get(idx))
          .filter((id): id is string => id !== undefined);

        if (relatedIds.length > 0) {
          await prisma.task.update({
            where: { id: taskId },
            data: {
              relatedTasks: {
                connect: relatedIds.map((id) => ({ id })),
              },
            },
          });
        }
      }
    }

    // Update plan status to approved
    await prisma.aIPlan.update({
      where: { id: planId },
      data: {
        status: "approved",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Успешно создано ${createdTasks.length} задач`,
      tasksCreated: createdTasks.length,
      tasks: createdTasks.map((t) => ({
        id: t.id,
        taskNumber: t.taskNumber,
        title: t.title,
      })),
    });
  } catch (error) {
    console.error("Error approving AI plan:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ошибка при утверждении плана",
      },
      { status: 500 }
    );
  }
}
