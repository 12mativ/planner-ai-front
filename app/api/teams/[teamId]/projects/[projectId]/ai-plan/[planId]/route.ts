import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
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
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
    }

    const { role, id: userId } = session.user;
    const isAdmin = role === "admin";
    const isTeamLead = project.team.leadId === userId;
    const isMember = project.team.members.some((m) => m.userId === userId);

    if (!isAdmin && !isTeamLead && !isMember) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    // Get the AI plan
    const aiPlan = await prisma.aIPlan.findUnique({
      where: { id: planId, projectId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        conversations: {
          orderBy: {
            createdAt: "asc",
          },
        },
        iterations: {
          orderBy: {
            iterationNum: "desc",
          },
        },
      },
    });

    if (!aiPlan) {
      return NextResponse.json({ error: "План не найден" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      plan: aiPlan,
    });
  } catch (error) {
    console.error("Error fetching AI plan:", error);
    return NextResponse.json(
      { error: "Ошибка при получении плана" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
        { error: "Только тимлид или администратор может удалять планы" },
        { status: 403 }
      );
    }

    // Delete the plan
    await prisma.aIPlan.delete({
      where: { id: planId, projectId },
    });

    return NextResponse.json({
      success: true,
      message: "План успешно удален",
    });
  } catch (error) {
    console.error("Error deleting AI plan:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении плана" },
      { status: 500 }
    );
  }
}
