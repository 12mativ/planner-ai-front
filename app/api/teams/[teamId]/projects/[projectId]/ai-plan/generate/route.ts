import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProjectPlan } from "@/lib/ai-planner";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; projectId: string }> }
) {
  try {
    const session = await auth();
    const { teamId, projectId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Check if user has access to this project
    const project = await prisma.project.findUnique({
      where: { id: projectId, teamId },
      include: {
        team: {
          include: {
            lead: true,
            members: {
              include: {
                user: true,
              },
            },
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

    // Only team lead and admin can generate AI plans
    if (!isAdmin && !isTeamLead) {
      return NextResponse.json(
        { error: "Только тимлид или администратор может генерировать AI-планы" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { prompt, additionalContext } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Описание проекта обязательно" },
        { status: 400 }
      );
    }

    // Prepare team members data
    const teamMembers = project.team.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.user.role,
    }));

    // Add team lead if not in members
    if (!teamMembers.find((m) => m.id === project.team.lead.id)) {
      teamMembers.unshift({
        id: project.team.lead.id,
        name: project.team.lead.name,
        email: project.team.lead.email,
        role: project.team.lead.role,
      });
    }

    // Generate plan using AI
    const generatedPlan = await generateProjectPlan({
      projectDescription: prompt,
      teamMembers,
      projectContext: {
        projectName: project.name,
        projectDescription: project.description,
        shortCode: project.shortCode,
        teamSize: teamMembers.length,
      },
      additionalContext,
    });

    // Save the plan to database
    const aiPlan = await prisma.aIPlan.create({
      data: {
        projectId,
        prompt,
        status: "draft",
        generatedPlan: generatedPlan as any,
        createdBy: userId,
      },
    });

    // Save initial conversation message
    await prisma.aIPlanMessage.create({
      data: {
        planId: aiPlan.id,
        role: "user",
        content: prompt,
      },
    });

    await prisma.aIPlanMessage.create({
      data: {
        planId: aiPlan.id,
        role: "assistant",
        content: JSON.stringify(generatedPlan),
      },
    });

    // Save first iteration
    await prisma.aIPlanIteration.create({
      data: {
        planId: aiPlan.id,
        iterationNum: 1,
        prompt,
        generatedPlan: generatedPlan as any,
      },
    });

    return NextResponse.json({
      success: true,
      plan: {
        id: aiPlan.id,
        generatedPlan,
        status: aiPlan.status,
        createdAt: aiPlan.createdAt,
      },
    });
  } catch (error) {
    console.error("Error generating AI plan:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ошибка при генерации плана",
      },
      { status: 500 }
    );
  }
}
