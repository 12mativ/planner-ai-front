import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/tasks/kanban-board";

interface PageProps {
  params: Promise<{ teamId: string; projectId: string }>;
}

export default async function ProjectKanbanPage({ params }: PageProps) {
  const session = await auth();
  const { teamId, projectId } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId, teamId },
    include: {
      team: {
        include: {
          members: { select: { userId: true } },
        },
      },
      tasks: {
        include: {
          assignees: { select: { id: true, name: true } },
        },
        orderBy: { taskNumber: "asc" },
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

  const { role, id: userId } = session.user;
  const isAdmin = role === "admin";
  const isTeamLead = project.team.leadId === userId;
  const isMember = project.team.members.some((m) => m.userId === userId);

  if (!isAdmin && !isTeamLead && !isMember) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg text-foreground">У вас нет доступа к этому проекту</div>
          <Button variant="link" className="mt-4" asChild>
            <Link href={`/dashboard/teams/${teamId}`}>← Назад к команде</Link>
          </Button>
        </div>
      </div>
    );
  }

  const tasks = project.tasks.map((task) => ({
    id: task.id,
    taskNumber: task.taskNumber,
    title: task.title,
    priority: task.priority,
    status: task.status,
    projectId: project.id,
    projectShortCode: project.shortCode,
    projectName: project.name,
    teamId,
    assignees: task.assignees,
  }));

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <Button variant="link" className="p-0 text-zinc-600 dark:text-zinc-400" asChild>
            <Link href={`/dashboard/teams/${teamId}/projects/${projectId}`}>
              ← Назад к проекту
            </Link>
          </Button>
          <div className="mt-4 flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Канбан-доска
            </h1>
            <span className="text-zinc-400 dark:text-zinc-500">—</span>
            <span className="text-xl text-zinc-600 dark:text-zinc-400">{project.name}</span>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">Нет задач</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              В проекте пока нет задач
            </p>
          </div>
        ) : (
          <KanbanBoard tasks={tasks} />
        )}
      </div>
    </div>
  );
}
