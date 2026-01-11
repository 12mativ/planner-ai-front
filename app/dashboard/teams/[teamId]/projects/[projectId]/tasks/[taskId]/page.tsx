import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TaskEditForm } from "@/components/tasks/task-edit-form";

interface PageProps {
  params: Promise<{ teamId: string; projectId: string; taskId: string }>;
}

export default async function TaskPage({ params }: PageProps) {
  const session = await auth();
  const { teamId, projectId, taskId } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  // Get the task with all relations
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
              lead: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      role: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!task) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg text-foreground">Задача не найдена</div>
          <Button variant="link" className="mt-4" asChild>
            <Link href={`/dashboard/teams/${teamId}/projects/${projectId}`}>
              ← Назад к проекту
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Verify team ID matches
  if (task.project.teamId !== teamId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg text-foreground">Задача не найдена</div>
          <Button variant="link" className="mt-4" asChild>
            <Link href={`/dashboard/teams/${teamId}/projects/${projectId}`}>
              ← Назад к проекту
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if user has access to this task
  const { role, id: userId } = session.user;
  const isAdmin = role === "admin";
  const isTeamLead = task.project.team.leadId === userId;
  const isMember = task.project.team.members.some((m) => m.userId === userId);
  const hasAccess = isAdmin || isTeamLead || isMember;

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg text-foreground">
            У вас нет доступа к этой задаче
          </div>
          <Button variant="link" className="mt-4" asChild>
            <Link href={`/dashboard/teams/${teamId}/projects/${projectId}`}>
              ← Назад к проекту
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const canManage = isAdmin || isTeamLead;
  const canEdit = canManage || task.authorId === userId;

  // Prepare team members for the edit form
  const teamMembers = task.project.team.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
  }));

  // Add team lead if not already in members
  if (!teamMembers.find((m) => m.id === task.project.team.lead.id)) {
    teamMembers.unshift({
      id: task.project.team.lead.id,
      name: task.project.team.lead.name,
      email: task.project.team.lead.email,
    });
  }

  // Get all tasks in the project for parent/related task selection
  const projectTasks = await prisma.task.findMany({
    where: { projectId },
    select: {
      id: true,
      taskNumber: true,
      title: true,
      status: true,
    },
    orderBy: {
      taskNumber: "asc",
    },
  });

  // Convert Date objects to strings for client components
  const taskData = {
    ...task,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="link"
            className="p-0 text-zinc-600 dark:text-zinc-400"
            asChild
          >
            <Link href={`/dashboard/teams/${teamId}/projects/${projectId}`}>
              ← Назад к проекту
            </Link>
          </Button>
        </div>

        <TaskEditForm
          task={taskData}
          teamId={teamId}
          projectId={projectId}
          projectShortCode={task.project.shortCode}
          teamMembers={teamMembers}
          projectTasks={projectTasks}
          canEdit={canEdit}
          canDelete={canManage || task.authorId === userId}
        />
      </div>
    </div>
  );
}
