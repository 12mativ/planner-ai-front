import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/auth/sign-out-button";
import Link from "next/link";
import { ROLE_NAMES } from "@/types/roles";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role } = session.user;
  const canManageTeams = role === "admin" || role === "team_lead";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground">Planner AI</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {session.user.name} ({ROLE_NAMES[role]})
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex gap-6">
            <Link
              href="/dashboard"
              className="border-b-2 border-foreground px-1 py-4 text-sm font-medium text-foreground"
            >
              Главная
            </Link>
            <Link
              href="/dashboard/teams"
              className="border-b-2 border-transparent px-1 py-4 text-sm font-medium text-zinc-600 hover:border-zinc-300 hover:text-foreground dark:text-zinc-400"
            >
              Команды
            </Link>
            {role === "admin" && (
              <Link
                href="/dashboard/admin"
                className="border-b-2 border-transparent px-1 py-4 text-sm font-medium text-zinc-600 hover:border-zinc-300 hover:text-foreground dark:text-zinc-400"
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
          {/* Welcome Section */}
          <div className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-3xl font-bold text-foreground">
              Добро пожаловать, {session.user.name}!
            </h2>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
              Вы успешно вошли в систему Planner AI
            </p>
          </div>

          {/* User Info Card */}
          <div className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-xl font-semibold text-foreground">
              Информация о пользователе
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Имя:
                </span>
                <p className="text-base text-foreground">{session.user.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Email:
                </span>
                <p className="text-base text-foreground">{session.user.email}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Роль:
                </span>
                <p className="text-base text-foreground">{ROLE_NAMES[role]}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  ID:
                </span>
                <p className="text-base font-mono text-foreground">
                  {session.user.id}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {canManageTeams && (
            <div className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-xl font-semibold text-foreground">
                Быстрые действия
              </h3>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/dashboard/teams/new"
                  className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-all hover:scale-105 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                >
                  Создать команду
                </Link>
                <Link
                  href="/dashboard/teams"
                  className="rounded-lg border-2 border-foreground px-4 py-2 text-sm font-medium text-foreground transition-all hover:scale-105 hover:bg-foreground hover:text-background"
                >
                  Управление командами
                </Link>
                {role === "admin" && (
                  <Link
                    href="/dashboard/admin"
                    className="rounded-lg border-2 border-foreground px-4 py-2 text-sm font-medium text-foreground transition-all hover:scale-105 hover:bg-foreground hover:text-background"
                  >
                    Панель администратора
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Features Section */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <span className="text-2xl">📝</span>
              </div>
              <h4 className="text-lg font-semibold text-foreground">
                Планирование задач
              </h4>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Создавайте и управляйте своими задачами с помощью ИИ
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <span className="text-2xl">🤖</span>
              </div>
              <h4 className="text-lg font-semibold text-foreground">
                ИИ-ассистент
              </h4>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Получайте умные рекомендации по планированию
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <span className="text-2xl">📊</span>
              </div>
              <h4 className="text-lg font-semibold text-foreground">
                Аналитика
              </h4>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Отслеживайте свою продуктивность и прогресс
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
