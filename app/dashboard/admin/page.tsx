import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUsers, getTeams } from "@/lib/auth";
import Link from "next/link";
import { ROLE_NAMES, UserRole } from "@/types/roles";
import { Button } from "@/components/ui/button";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Only admins can access this page
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const users = await getUsers();
  const teams = await getTeams();

  // Calculate statistics
  const adminCount = users.filter((u) => u.role === "admin").length;
  const teamLeadCount = users.filter((u) => u.role === "team_lead").length;
  const userCount = users.filter((u) => u.role === "user").length;

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
              {session.user.name} ({ROLE_NAMES[session.user.role]})
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
              className="border-b-2 border-transparent px-1 py-4 text-sm font-medium text-zinc-600 hover:border-indigo-300 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
            >
              Команды
            </Link>
            <Link
              href="/dashboard/admin"
              className="border-b-2 border-indigo-500 px-1 py-4 text-sm font-medium text-indigo-600 dark:text-indigo-400"
            >
              Администрирование
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Панель администратора
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Управление пользователями и командами системы
            </p>
          </div>

          {/* Statistics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Всего пользователей
                  </p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {users.length}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Администраторов
                  </p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {adminCount}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <span className="text-2xl">👑</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Тимлидов
                  </p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {teamLeadCount}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <span className="text-2xl">⭐</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Команд
                  </p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {teams.length}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                  <span className="text-2xl">🏢</span>
                </div>
              </div>
            </div>
          </div>

          {/* All Users */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-foreground">
              Все пользователи
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="pb-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Имя
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Email
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Роль
                    </th>
                    <th className="pb-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Команд
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="py-3 text-sm text-foreground">
                        {user.name}
                      </td>
                      <td className="py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {user.email}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                          {ROLE_NAMES[user.role as UserRole]}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {user.teamIds.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* All Teams */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Все команды
              </h2>
              <Button variant="link" asChild>
                <Link href="/dashboard/teams">
                  Управление командами →
                </Link>
              </Button>
            </div>
            {teams.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Команды еще не созданы
              </p>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teams.map((team) => {
                  const lead = users.find((u) => u.id === team.leadId);
                  return (
                    <div
                      key={team.id}
                      className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                    >
                      <h3 className="font-semibold text-foreground">
                        {team.name}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Тимлид: {lead?.name || "Неизвестно"}
                      </p>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Участников: {team.memberIds.length}
                      </p>
                      <Button variant="link" className="mt-3 p-0 h-auto" asChild>
                        <Link href={`/dashboard/teams/${team.id}/manage`}>
                          Управление →
                        </Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
