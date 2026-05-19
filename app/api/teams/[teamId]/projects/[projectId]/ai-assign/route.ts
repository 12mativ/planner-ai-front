import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignTasks, Worker, TaskToAssign } from "@/lib/ai-planner";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  team_lead: "Team Lead",
  user: "Developer",
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string; projectId: string }> }
) {
  try {
    const session = await auth();
    const { teamId, projectId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId, teamId },
      include: {
        team: {
          include: {
            lead: { select: { id: true, name: true, role: true } },
            members: {
              include: {
                user: { select: { id: true, name: true, role: true } },
              },
            },
          },
        },
        tasks: {
          include: {
            assignees: { select: { id: true } },
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

    if (!isAdmin && !isTeamLead) {
      return NextResponse.json(
        { error: "Только тимлид или администратор может назначать задачи через AI" },
        { status: 403 }
      );
    }

    // Build unique team members list (lead + members)
    const memberMap = new Map<string, { id: string; name: string; role: string }>();
    memberMap.set(project.team.lead.id, project.team.lead);
    for (const m of project.team.members) {
      memberMap.set(m.user.id, m.user);
    }
    const allMembers = Array.from(memberMap.values());

    // Map assigned tasks per worker for current tasks list
    const tasksByAssignee = new Map<string, typeof project.tasks>();
    for (const task of project.tasks) {
      for (const assignee of task.assignees) {
        if (!tasksByAssignee.has(assignee.id)) tasksByAssignee.set(assignee.id, []);
        tasksByAssignee.get(assignee.id)!.push(task);
      }
    }

    const workers: Worker[] = allMembers.map((member) => ({
      id: member.id,
      name: member.name,
      role: ROLE_LABELS[member.role] ?? "Developer",
      availableHoursPerWeek: 40,
      currentTasks: (tasksByAssignee.get(member.id) ?? [])
        .filter((t) => t.status !== "done")
        .map((t) => ({
          title: t.title,
          estimatedHours: 8,
          priority: t.priority,
        })),
    }));

    // Tasks with no assignees and status todo
    const tasksToAssign: TaskToAssign[] = project.tasks
      .filter((t) => t.assignees.length === 0 && t.status === "todo")
      .map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description ?? "",
        estimatedHours: 8,
        priority: t.priority,
        tags: [],
      }));

    if (tasksToAssign.length === 0) {
      return NextResponse.json(
        { error: "Нет задач без исполнителя для назначения" },
        { status: 400 }
      );
    }

    const result = await assignTasks({ workers, tasksToAssign });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("AI assign error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка AI назначения" },
      { status: 500 }
    );
  }
}
