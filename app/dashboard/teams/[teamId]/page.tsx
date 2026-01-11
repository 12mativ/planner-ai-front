import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTeamById, getUserById } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROLE_NAMES } from "@/types/roles";
import { prisma } from "@/lib/prisma";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import { ProjectsList } from "@/components/projects/projects-list";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamViewPage({ params }: PageProps) {
  const session = await auth();
  const { teamId } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  const team = await getTeamById(teamId);

  if (!team) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg text-foreground">Команда не найдена</div>
          <Button variant="link" className="mt-4" asChild>
            <Link href="/dashboard/teams">← Назад к командам</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if user has access to this team
  const { role, id: userId } = session.user;
  const isAdmin = role === "admin";
  const isTeamLead = team.leadId === userId;
  const isMember = team.memberIds.includes(userId);
  const hasAccess = isAdmin || isTeamLead || isMember;

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg text-foreground">
            У вас нет доступа к этой команде
          </div>
          <Button variant="link" className="mt-4" asChild>
            <Link href="/dashboard/teams">← Назад к командам</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Get team lead info
  const teamLead = await getUserById(team.leadId);

  // Get all members info including team lead
  const allMemberIds = [...new Set([team.leadId, ...team.memberIds])];
  const membersData = await Promise.all(
    allMemberIds.map((id) => getUserById(id))
  );
  const members = membersData.filter((m) => m !== null);

  const canManage = isAdmin || isTeamLead;

  // Get all projects for this team
  const projectsRaw = await prisma.project.findMany({
    where: { teamId },
    orderBy: { createdAt: "desc" },
  });

  // Convert Date objects to strings for client components
  const projects = projectsRaw.map((project) => ({
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }));

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
            <Link href="/dashboard/teams">← Назад к командам</Link>
          </Button>
          <div className="mt-4 flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                {team.name}
              </h1>
              {team.description && (
                <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
                  {team.description}
                </p>
              )}
            </div>
            {canManage && (
              <Button asChild>
                <Link href={`/dashboard/teams/${team.id}/manage`}>
                  Управление
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Team Info Card */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold text-foreground">
            Информация о команде
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Тимлид:
              </span>
              <div className="mt-1">
                <p className="text-base font-medium text-foreground">
                  {teamLead?.name || "Неизвестно"}
                </p>
                {teamLead?.email && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {teamLead.email}
                  </p>
                )}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Количество участников:
              </span>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {members.length}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                ID команды:
              </span>
              <p className="mt-1 font-mono text-sm text-foreground">
                {team.id}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Ваша роль:
              </span>
              <p className="mt-1 text-base text-foreground">
                {isTeamLead ? (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Тимлид
                  </span>
                ) : isMember ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                    Участник
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Администратор
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Участники команды ({members.length})
            </h2>
          </div>

          {members.length === 0 ? (
            <div className="mt-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                В команде пока нет участников
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((member) => {
                if (!member) return null;
                const isLead = member.id === team.leadId;

                return (
                  <div
                    key={member.id}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                            <span className="text-lg font-semibold text-foreground">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {member.name}
                            </p>
                            {isLead && (
                              <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                Тимлид
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="mt-2 truncate text-sm text-zinc-600 dark:text-zinc-400">
                          {member.email}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                          {ROLE_NAMES[member.role as keyof typeof ROLE_NAMES]}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Projects Section */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Проекты команды ({projects.length})
            </h2>
          </div>

          {canManage && (
            <div className="mb-6">
              <CreateProjectForm teamId={teamId} />
            </div>
          )}

          <ProjectsList projects={projects} teamId={teamId} canManage={canManage} />
        </div>


        {/* Quick Actions */}
        {canManage && (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-foreground">
              Быстрые действия
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={`/dashboard/teams/${team.id}/manage`}>
                  Управление командой
                </Link>
              </Button>
              <Button variant="outline" disabled>
                Создать задачу
              </Button>
              <Button variant="outline" disabled>
                Просмотр отчетов
              </Button>
            </div>
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
              Некоторые функции будут доступны в будущих обновлениях
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
