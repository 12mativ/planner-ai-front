import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/teams/[teamId]/projects/[projectId]/tasks - Get all tasks for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; projectId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { teamId, projectId } = await params;

    // Get the project and verify access
    const project = await prisma.project.findUnique({
      where: { id: projectId, teamId },
      include: {
        team: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
    }

    // Check permissions
    const isTeamLead = project.team.leadId === session.user.id;
    const isTeamMember = project.team.members.length > 0;
    const isAdmin = session.user.role === "admin";

    if (!isAdmin && !isTeamLead && !isTeamMember) {
      return NextResponse.json(
        { error: "Недостаточно прав" },
        { status: 403 }
      );
    }

    // Get all tasks for the project
    const tasks = await prisma.task.findMany({
      where: { projectId },
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении задач" },
      { status: 500 }
    );
  }
}

// POST /api/teams/[teamId]/projects/[projectId]/tasks - Create a new task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; projectId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { teamId, projectId } = await params;
    const body = await request.json();
    const { title, description, priority, assigneeIds, observerIds, parentId, relatedTaskIds } = body;

    // Validate required fields
    if (!title || title.trim() === "") {
      return NextResponse.json(
        { error: "Название задачи обязательно" },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ["low", "medium", "high", "critical"];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: "Неверный приоритет" },
        { status: 400 }
      );
    }

    // Get the project and verify access
    const project = await prisma.project.findUnique({
      where: { id: projectId, teamId },
      include: {
        team: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
    }

    // Check permissions - team members can create tasks
    const isTeamLead = project.team.leadId === session.user.id;
    const isTeamMember = project.team.members.length > 0;
    const isAdmin = session.user.role === "admin";

    if (!isAdmin && !isTeamLead && !isTeamMember) {
      return NextResponse.json(
        { error: "Недостаточно прав для создания задачи" },
        { status: 403 }
      );
    }

    // Get team to check lead
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { leadId: true },
    });

    // Verify assignees and observers are team members or team lead
    if (assigneeIds && assigneeIds.length > 0) {
      const teamMembers = await prisma.teamMember.findMany({
        where: {
          teamId,
          userId: { in: assigneeIds },
        },
      });

      const validUserIds = new Set([
        ...teamMembers.map((m) => m.userId),
        team?.leadId,
      ]);

      const allValid = assigneeIds.every((id: string) => validUserIds.has(id));

      if (!allValid) {
        return NextResponse.json(
          { error: "Некоторые исполнители не являются членами команды" },
          { status: 400 }
        );
      }
    }

    if (observerIds && observerIds.length > 0) {
      const teamMembers = await prisma.teamMember.findMany({
        where: {
          teamId,
          userId: { in: observerIds },
        },
      });

      const validUserIds = new Set([
        ...teamMembers.map((m) => m.userId),
        team?.leadId,
      ]);

      const allValid = observerIds.every((id: string) => validUserIds.has(id));

      if (!allValid) {
        return NextResponse.json(
          { error: "Некоторые наблюдатели не являются членами команды" },
          { status: 400 }
        );
      }
    }

    // Verify parent task exists and belongs to the same project
    if (parentId) {
      const parentTask = await prisma.task.findUnique({
        where: { id: parentId, projectId },
      });

      if (!parentTask) {
        return NextResponse.json(
          { error: "Родительская задача не найдена в этом проекте" },
          { status: 400 }
        );
      }
    }

    // Verify related tasks exist and belong to the same project
    if (relatedTaskIds && relatedTaskIds.length > 0) {
      const relatedTasks = await prisma.task.findMany({
        where: {
          id: { in: relatedTaskIds },
          projectId,
        },
      });

      if (relatedTasks.length !== relatedTaskIds.length) {
        return NextResponse.json(
          { error: "Некоторые связанные задачи не найдены в этом проекте" },
          { status: 400 }
        );
      }
    }

    // Get the next task number for this project
    const lastTask = await prisma.task.findFirst({
      where: { projectId },
      orderBy: { taskNumber: "desc" },
      select: { taskNumber: true },
    });

    const nextTaskNumber = (lastTask?.taskNumber || 0) + 1;

    // Create the task
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        taskNumber: nextTaskNumber,
        description: description?.trim() || "",
        priority: priority || "medium",
        projectId,
        authorId: session.user.id,
        ...(parentId && { parentId }),
        ...(assigneeIds &&
          assigneeIds.length > 0 && {
            assignees: {
              connect: assigneeIds.map((id: string) => ({ id })),
            },
          }),
        ...(observerIds &&
          observerIds.length > 0 && {
            observers: {
              connect: observerIds.map((id: string) => ({ id })),
            },
          }),
        ...(relatedTaskIds &&
          relatedTaskIds.length > 0 && {
            relatedTasks: {
              connect: relatedTaskIds.map((id: string) => ({ id })),
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

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Ошибка при создании задачи" },
      { status: 500 }
    );
  }
}
