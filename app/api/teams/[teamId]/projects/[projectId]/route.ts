import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/teams/[teamId]/projects/[projectId] - Get a specific project
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

    // Get the project
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

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении проекта" },
      { status: 500 }
    );
  }
}

// PATCH /api/teams/[teamId]/projects/[projectId] - Update a project
export async function PATCH(
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
    const { name, description, status } = body;

    // Get the project
    const project = await prisma.project.findUnique({
      where: { id: projectId, teamId },
      include: {
        team: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
    }

    // Check permissions - only admin or team lead can update projects
    const isTeamLead = project.team.leadId === session.user.id;
    const isAdmin = session.user.role === "admin";

    if (!isAdmin && !isTeamLead) {
      return NextResponse.json(
        { error: "Только администратор или лидер команды может обновлять проекты" },
        { status: 403 }
      );
    }

    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении проекта" },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[teamId]/projects/[projectId] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; projectId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { teamId, projectId } = await params;

    // Get the project
    const project = await prisma.project.findUnique({
      where: { id: projectId, teamId },
      include: {
        team: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
    }

    // Check permissions - only admin or team lead can delete projects
    const isTeamLead = project.team.leadId === session.user.id;
    const isAdmin = session.user.role === "admin";

    if (!isAdmin && !isTeamLead) {
      return NextResponse.json(
        { error: "Только администратор или лидер команды может удалять проекты" },
        { status: 403 }
      );
    }

    // Delete the project
    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ message: "Проект успешно удален" });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении проекта" },
      { status: 500 }
    );
  }
}
