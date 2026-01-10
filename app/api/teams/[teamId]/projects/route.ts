import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/teams/[teamId]/projects - Get all projects for a team
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { teamId } = await params;

    // Check if user has access to this team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Команда не найдена" }, { status: 404 });
    }

    // Check permissions - user must be admin, team lead, or team member
    const isTeamLead = team.leadId === session.user.id;
    const isTeamMember = team.members.length > 0;
    const isAdmin = session.user.role === "admin";

    if (!isAdmin && !isTeamLead && !isTeamMember) {
      return NextResponse.json(
        { error: "Недостаточно прав" },
        { status: 403 }
      );
    }

    // Get all projects for this team
    const projects = await prisma.project.findMany({
      where: { teamId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении проектов" },
      { status: 500 }
    );
  }
}

// POST /api/teams/[teamId]/projects - Create a new project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { teamId } = await params;
    const body = await request.json();
    const { name, description, status } = body;

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Название проекта обязательно" },
        { status: 400 }
      );
    }

    // Check if user has access to this team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Команда не найдена" }, { status: 404 });
    }

    // Check permissions - only admin or team lead can create projects
    const isTeamLead = team.leadId === session.user.id;
    const isAdmin = session.user.role === "admin";

    if (!isAdmin && !isTeamLead) {
      return NextResponse.json(
        { error: "Только администратор или лидер команды может создавать проекты" },
        { status: 403 }
      );
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || "",
        status: status || "active",
        teamId,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { error: "Ошибка при создании проекта" },
      { status: 500 }
    );
  }
}
