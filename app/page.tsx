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
      </main>
    </div>
  );
}
