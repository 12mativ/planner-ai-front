import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProjectView } from "@/components/projects/project-view";

interface PageProps {
  params: Promise<{ teamId: string; projectId: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const session = await auth();
  const { teamId, projectId } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  // Get the project with team and tasks
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
      tasks: {
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
        },
        orderBy: {
          createdAt: "desc",
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

  const canManage = isAdmin || isTeamLead;

  // Prepare team members for the task form
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

  // Convert Date objects to strings for client components
  const tasks = project.tasks.map((task) => ({
    ...task,
    startDate: task.startDate?.toISOString() || null,
    endDate: task.endDate?.toISOString() || null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }));

  // Calculate statistics
  const totalTasks = tasks.length;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
            Активный
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Завершен
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            Архивирован
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div>
          <Button
            variant="link"
            className="p-0 text-zinc-600 dark:text-zinc-400"
            asChild
          >
            <Link href={`/dashboard/teams/${teamId}`}>← Назад к команде</Link>
          </Button>
          <div className="mt-4">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                {project.name}
              </h1>
              {getStatusBadge(project.status)}
            </div>
            {project.description && (
              <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {/* Project Info Card */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Информация о проекте
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Команда:
              </span>
              <p className="mt-1 text-base font-medium text-foreground">
                {project.team.name}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Тимлид:
              </span>
              <p className="mt-1 text-base font-medium text-foreground">
                {project.team.lead.name}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Создан:
              </span>
              <p className="mt-1 text-base text-foreground">
                {new Date(project.createdAt).toLocaleDateString("ru-RU")}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Участников команды:
              </span>
              <p className="mt-1 text-base text-foreground">
                {teamMembers.length}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Статистика задач
          </h2>
          <div className="grid gap-6 sm:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <span className="text-2xl">📋</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalTasks}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Всего задач
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <span className="text-2xl">⏳</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{inProgressTasks}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                В работе
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{doneTasks}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Завершено
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Прогресс
              </p>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <ProjectView
          tasks={tasks}
          teamId={teamId}
          projectId={projectId}
          projectShortCode={project.shortCode}
          currentUserId={userId}
          canManage={canManage}
          totalTasks={totalTasks}
        />
      </div>
    </div>
  );
}
