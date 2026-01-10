import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-20 sm:px-8">
      <main className="flex max-w-4xl flex-col items-center gap-8 text-center">
        {/* Main Title */}
        <h1 className="text-6xl font-bold tracking-tight text-foreground sm:text-7xl lg:text-8xl">
          Planner AI
        </h1>

        {/* Description/Tagline */}
        <p className="max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-xl">
          Ваш помощник по планированию на основе ИИ. Организуйте свои задачи, повышайте продуктивность
          и планируйте умнее с искусственным интеллектом.
        </p>

        {/* CTA Buttons - Different based on auth status */}
        {session?.user ? (
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button size="lg" className="rounded-full px-12" asChild>
              <Link href="/dashboard">
                Перейти в Dashboard
              </Link>
            </Button>
            <span className="flex items-center text-sm text-zinc-600 dark:text-zinc-400">
              Вы вошли как {session.user.name}
            </span>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="rounded-full px-12" asChild>
              <Link href="/register">
                Начать
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-12" asChild>
              <Link href="/login">
                Войти
              </Link>
            </Button>
          </div>
        )}

        {/* Optional Secondary Link */}
        <Button variant="link" asChild>
          <a href="#features">
            Узнать больше о Planner AI
          </a>
        </Button>

        {/* Features Section */}
        <div id="features" className="mt-16 grid gap-8 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 text-4xl">📝</div>
            <h3 className="text-lg font-semibold text-foreground">
              Умное планирование
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              ИИ помогает организовать задачи эффективно
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 text-4xl">🤖</div>
            <h3 className="text-lg font-semibold text-foreground">
              ИИ-ассистент
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Персональные рекомендации для продуктивности
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 text-4xl">📊</div>
            <h3 className="text-lg font-semibold text-foreground">
              Аналитика
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Отслеживайте прогресс и достижения
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
