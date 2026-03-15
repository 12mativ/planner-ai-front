import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refineProjectPlan } from "@/lib/ai-planner";
import type { GeneratedPlan } from "@/lib/ai-planner";

export async function PATCH(
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

    if (!isAdmin && !isTeamLead) {
      return NextResponse.json(
        { error: "Только тимлид или администратор может уточнять планы" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { refinementPrompt } = body;

    if (!refinementPrompt || typeof refinementPrompt !== "string") {
      return NextResponse.json(
        { error: "Запрос на уточнение обязателен" },
        { status: 400 }
      );
    }

    // Get existing plan
    const existingPlan = await prisma.aIPlan.findUnique({
      where: { id: planId, projectId },
      include: {
        conversations: {
          orderBy: {
            createdAt: "asc",
          },
        },
        iterations: {
          orderBy: {
            iterationNum: "desc",
          },
          take: 1,
        },
      },
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "План не найден" }, { status: 404 });
    }

    // Prepare team members
    const teamMembers = project.team.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.user.role,
    }));

    if (!teamMembers.find((m) => m.id === project.team.lead.id)) {
      teamMembers.unshift({
        id: project.team.lead.id,
        name: project.team.lead.name,
        email: project.team.lead.email,
        role: project.team.lead.role,
      });
    }

    // Build conversation history
    const conversationHistory = existingPlan.conversations.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Refine the plan
    const refinedPlan = await refineProjectPlan({
      currentPlan: existingPlan.generatedPlan as unknown as GeneratedPlan,
      refinementPrompt,
      conversationHistory,
      teamMembers,
      projectContext: {
        projectName: project.name,
        projectDescription: project.description,
        shortCode: project.shortCode,
        teamSize: teamMembers.length,
      },
    });

    // Update the plan
    const updatedPlan = await prisma.aIPlan.update({
      where: { id: planId },
      data: {
        generatedPlan: refinedPlan as any,
        updatedAt: new Date(),
      },
    });

    // Save conversation messages
    await prisma.aIPlanMessage.create({
      data: {
        planId,
        role: "user",
        content: refinementPrompt,
      },
    });

    await prisma.aIPlanMessage.create({
      data: {
        planId,
        role: "assistant",
        content: JSON.stringify(refinedPlan),
      },
    });

    // Save new iteration
    const lastIteration = existingPlan.iterations[0];
    const newIterationNum = lastIteration ? lastIteration.iterationNum + 1 : 2;

    await prisma.aIPlanIteration.create({
      data: {
        planId,
        iterationNum: newIterationNum,
        prompt: refinementPrompt,
        generatedPlan: refinedPlan as any,
      },
    });

    return NextResponse.json({
      success: true,
      plan: {
        id: updatedPlan.id,
        generatedPlan: refinedPlan,
        status: updatedPlan.status,
        updatedAt: updatedPlan.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error refining AI plan:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ошибка при уточнении плана",
      },
      { status: 500 }
    );
  }
}
