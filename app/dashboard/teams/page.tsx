import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTeams, getTeamsByLeadId, getUserById } from "@/lib/auth";
import Link from "next/link";
import { ROLE_NAMES } from "@/types/roles";
import { Button } from "@/components/ui/button";

export default async function TeamsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role, id } = session.user;

  // Get teams based on role
  let teams;
  if (role === "admin") {
    teams = await getTeams();
  } else if (role === "team_lead") {
    teams = await getTeamsByLeadId(id);
  } else {
    // Regular users see teams they're part of
    const allTeams = await getTeams();
    teams = allTeams.filter((team) => team.memberIds.includes(id));
  }

  const canCreateTeams = role === "admin" || role === "team_lead";

  // Get all team leads
  const leadIds = [...new Set(teams.map(t => t.leadId))];
  const leads = await Promise.all(leadIds.map(id => getUserById(id)));
  const leadsMap = new Map(leads.filter(l => l !== null).map(l => [l!.id, l]));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-2xl font-bold text-foreground hover:opacity-80">
            Planner AI
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {session.user.name} ({ROLE_NAMES[role]})
            </span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex gap-6">
            <Link
              href="/dashboard"
              className="border-b-2 border-transparent px-1 py-4 text-sm font-medium text-zinc-600 hover:border-indigo-300 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
            >
              Главная
            </Link>
            <Link
              href="/dashboard/teams"
              className="border-b-2 border-indigo-500 px-1 py-4 text-sm font-medium text-indigo-600 dark:text-indigo-400"
            >
              Команды
            </Link>
            {role === "admin" && (
              <Link
                href="/dashboard/admin"
                className="border-b-2 border-transparent px-1 py-4 text-sm font-medium text-zinc-600 hover:border-indigo-300 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
              >
                Администрирование
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="space-y-8">
          {/* Header with Create Button */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Команды</h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                {role === "admin" && "Все команды в системе"}
                {role === "team_lead" && "Команды, которыми вы управляете"}
                {role === "user" && "Команды, в которых вы участвуете"}
              </p>
            </div>
            {canCreateTeams && (
              <Button asChild>
                <Link href="/dashboard/teams/new">
                  Создать команду
                </Link>
              </Button>
            )}
          </div>

          {/* Teams List */}
          {teams.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Нет команд
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {canCreateTeams
                  ? "Создайте свою первую команду, чтобы начать работу"
                  : "Вы пока не состоите ни в одной команде"}
              </p>
              {canCreateTeams && (
                <Button className="mt-4" asChild>
                  <Link href="/dashboard/teams/new">
                    Создать команду
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => {
                const lead = leadsMap.get(team.leadId);
                const isLead = team.leadId === id;
                const isAdmin = role === "admin";
                const canManage = isLead || isAdmin;

                return (
                  <div
                    key={team.id}
                    className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {team.name}
                        </h3>
                        {team.description && (
                          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            {team.description}
                          </p>
                        )}
                      </div>
                      {isLead && (
                        <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Лидер
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          Тимлид:
                        </span>
                        <span className="font-medium text-foreground">
                          {lead?.name || "Неизвестно"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          Участников:
                        </span>
                        <span className="font-medium text-foreground">
                          {team.memberIds.length}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" className="flex-1" asChild>
                        <Link href={`/dashboard/teams/${team.id}`}>
                          Просмотр
                        </Link>
                      </Button>
                      {canManage && (
                        <Button className="flex-1" asChild>
                          <Link href={`/dashboard/teams/${team.id}/manage`}>
                            Управление
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
