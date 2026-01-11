import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreateTaskPageForm } from "@/components/tasks/create-task-page-form";

interface PageProps {
  params: Promise<{ teamId: string; projectId: string }>;
}

export default async function NewTaskPage({ params }: PageProps) {
  const session = await auth();
  const { teamId, projectId } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  // Get the project with team
  const project = await prisma.project.findUnique({
    where: { id: projectId, teamId },
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
  });

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg text-foreground">Проект не найден</div>
          <Button variant="link" className="mt-4" asChild>
            <Link href={`/dashboard/teams/${teamId}`}>← Назад к команде</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if user has access to this project
  const { role, id: userId } = session.user;
  const isAdmin = role === "admin";
  const isTeamLead = project.team.leadId === userId;
  const isMember = project.team.members.some((m) => m.userId === userId);
  const hasAccess = isAdmin || isTeamLead || isMember;

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg text-foreground">
            У вас нет доступа к этому проекту
          </div>
          <Button variant="link" className="mt-4" asChild>
            <Link href={`/dashboard/teams/${teamId}`}>← Назад к команде</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Prepare team members for the form
  const teamMembers = project.team.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
  }));

  // Add team lead if not already in members
  if (!teamMembers.find((m) => m.id === project.team.lead.id)) {
    teamMembers.unshift({
      id: project.team.lead.id,
      name: project.team.lead.name,
      email: project.team.lead.email,
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

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-4xl">
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
          <h1 className="mt-4 text-3xl font-bold text-foreground">
            Создать новую задачу
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Проект: {project.name}
          </p>
        </div>

        <CreateTaskPageForm
          teamId={teamId}
          projectId={projectId}
          teamMembers={teamMembers}
          projectTasks={projectTasks}
        />
      </div>
    </div>
  );
}
