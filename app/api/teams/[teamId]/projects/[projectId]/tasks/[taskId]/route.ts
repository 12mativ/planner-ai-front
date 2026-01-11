import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/teams/[teamId]/projects/[projectId]/tasks/[taskId] - Get a specific task
export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ teamId: string; projectId: string; taskId: string }>;
  }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { teamId, projectId, taskId } = await params;

    // Get the task
    const task = await prisma.task.findUnique({
      where: { id: taskId, projectId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignees: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        observers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            taskNumber: true,
            title: true,
          },
        },
        subtasks: {
          select: {
            id: true,
            taskNumber: true,
            title: true,
            status: true,
          },
        },
        relatedTasks: {
          select: {
            id: true,
            taskNumber: true,
            title: true,
          },
        },
        project: {
          include: {
            team: {
              include: {
                members: {
                  where: { userId: session.user.id },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Задача не найдена" }, { status: 404 });
    }

    // Verify team ID matches
    if (task.project.teamId !== teamId) {
      return NextResponse.json({ error: "Задача не найдена" }, { status: 404 });
    }

    // Check permissions
    const isTeamLead = task.project.team.leadId === session.user.id;
    const isTeamMember = task.project.team.members.length > 0;
    const isAdmin = session.user.role === "admin";

    if (!isAdmin && !isTeamLead && !isTeamMember) {
      return NextResponse.json(
        { error: "Недостаточно прав" },
        { status: 403 }
      );
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Get task error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении задачи" },
      { status: 500 }
    );
  }
}

// PATCH /api/teams/[teamId]/projects/[projectId]/tasks/[taskId] - Update a task
export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ teamId: string; projectId: string; taskId: string }>;
  }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { teamId, projectId, taskId } = await params;
    const body = await request.json();
    const { title, description, priority, status, assigneeIds, observerIds, parentId, relatedTaskIds } =
      body;

    // Validate priority if provided
    if (priority) {
      const validPriorities = ["low", "medium", "high", "critical"];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          { error: "Неверный приоритет" },
          { status: 400 }
        );
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ["todo", "in_progress", "done"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Неверный статус" },
          { status: 400 }
        );
      }
    }

    // Get the task
    const task = await prisma.task.findUnique({
      where: { id: taskId, projectId },
      include: {
        project: {
          include: {
            team: {
              include: {
                members: {
                  where: { userId: session.user.id },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Задача не найдена" }, { status: 404 });
    }

    // Verify team ID matches
    if (task.project.teamId !== teamId) {
      return NextResponse.json({ error: "Задача не найдена" }, { status: 404 });
    }

    // Check permissions - team members can update tasks
    const isTeamLead = task.project.team.leadId === session.user.id;
    const isTeamMember = task.project.team.members.length > 0;
    const isAdmin = session.user.role === "admin";

    if (!isAdmin && !isTeamLead && !isTeamMember) {
      return NextResponse.json(
        { error: "Недостаточно прав для обновления задачи" },
        { status: 403 }
      );
    }

    // Get team to check lead
    const teamData = await prisma.team.findUnique({
      where: { id: teamId },
      select: { leadId: true },
    });

    // Verify assignees and observers are team members or team lead if provided
    if (assigneeIds !== undefined) {
      if (assigneeIds.length > 0) {
        const teamMembers = await prisma.teamMember.findMany({
          where: {
            teamId,
            userId: { in: assigneeIds },
          },
        });

        const validUserIds = new Set([
          ...teamMembers.map((m) => m.userId),
          teamData?.leadId,
        ]);

        const allValid = assigneeIds.every((id: string) => validUserIds.has(id));

        if (!allValid) {
          return NextResponse.json(
            { error: "Некоторые исполнители не являются членами команды" },
            { status: 400 }
          );
        }
      }
    }

    if (observerIds !== undefined) {
      if (observerIds.length > 0) {
        const teamMembers = await prisma.teamMember.findMany({
          where: {
            teamId,
            userId: { in: observerIds },
          },
        });

        const validUserIds = new Set([
          ...teamMembers.map((m) => m.userId),
          teamData?.leadId,
        ]);

        const allValid = observerIds.every((id: string) => validUserIds.has(id));

        if (!allValid) {
          return NextResponse.json(
            { error: "Некоторые наблюдатели не являются членами команды" },
            { status: 400 }
          );
        }
      }
    }

    // Verify parent task exists and belongs to the same project (if provided)
    if (parentId !== undefined) {
      if (parentId !== null) {
        // Check if trying to set self as parent
        if (parentId === taskId) {
          return NextResponse.json(
            { error: "Задача не может быть родительской для самой себя" },
            { status: 400 }
          );
        }

        const parentTask = await prisma.task.findUnique({
          where: { id: parentId, projectId },
        });

        if (!parentTask) {
          return NextResponse.json(
            { error: "Родительская задача не найдена в этом проекте" },
            { status: 400 }
          );
        }

        // Check for circular dependency
        let currentParent = parentTask;
        while (currentParent.parentId) {
          if (currentParent.parentId === taskId) {
            return NextResponse.json(
              { error: "Обнаружена циклическая зависимость задач" },
              { status: 400 }
            );
          }
          const nextParent = await prisma.task.findUnique({
            where: { id: currentParent.parentId },
          });
          if (!nextParent) break;
          currentParent = nextParent;
        }
      }
    }

    // Verify related tasks exist and belong to the same project (if provided)
    if (relatedTaskIds !== undefined && relatedTaskIds.length > 0) {
      // Filter out self-reference
      const filteredRelatedTaskIds = relatedTaskIds.filter((id: string) => id !== taskId);

      if (filteredRelatedTaskIds.length > 0) {
        const relatedTasks = await prisma.task.findMany({
          where: {
            id: { in: filteredRelatedTaskIds },
            projectId,
          },
        });

        if (relatedTasks.length !== filteredRelatedTaskIds.length) {
          return NextResponse.json(
            { error: "Некоторые связанные задачи не найдены в этом проекте" },
            { status: 400 }
          );
        }
      }
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(assigneeIds !== undefined && {
          assignees: {
            set: assigneeIds.map((id: string) => ({ id })),
          },
        }),
        ...(observerIds !== undefined && {
          observers: {
            set: observerIds.map((id: string) => ({ id })),
          },
        }),
        ...(relatedTaskIds !== undefined && {
          relatedTasks: {
            set: relatedTaskIds
              .filter((id: string) => id !== taskId)
              .map((id: string) => ({ id })),
          },
        }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignees: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        observers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            taskNumber: true,
            title: true,
          },
        },
        subtasks: {
          select: {
            id: true,
            taskNumber: true,
            title: true,
            status: true,
          },
        },
        relatedTasks: {
          select: {
            id: true,
            taskNumber: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении задачи" },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[teamId]/projects/[projectId]/tasks/[taskId] - Delete a task
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ teamId: string; projectId: string; taskId: string }>;
  }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { teamId, projectId, taskId } = await params;

    // Get the task
    const task = await prisma.task.findUnique({
      where: { id: taskId, projectId },
      include: {
        project: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Задача не найдена" }, { status: 404 });
    }

    // Verify team ID matches
    if (task.project.teamId !== teamId) {
      return NextResponse.json({ error: "Задача не найдена" }, { status: 404 });
    }

    // Check permissions - only admin, team lead, or task author can delete tasks
    const isTeamLead = task.project.team.leadId === session.user.id;
    const isTaskAuthor = task.authorId === session.user.id;
    const isAdmin = session.user.role === "admin";

    if (!isAdmin && !isTeamLead && !isTaskAuthor) {
      return NextResponse.json(
        {
          error:
            "Только администратор, лидер команды или автор задачи может удалять задачи",
        },
        { status: 403 }
      );
    }

    // Delete the task
    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ message: "Задача успешно удалена" });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении задачи" },
      { status: 500 }
    );
  }
}
