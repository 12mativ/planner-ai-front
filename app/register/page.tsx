"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { UserRole, ROLE_NAMES, ROLE_DESCRIPTIONS } from "@/types/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (password !== confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }

    // Validate password length
    if (password.length < 6) {
      toast.error("Пароль должен содержать минимум 6 символов");
      return;
    }

    setIsLoading(true);

    try {
      // Register the user
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Ошибка при регистрации");
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        toast.error("Регистрация успешна, но не удалось войти автоматически");
        router.push("/login");
      } else {
        toast.success("Регистрация успешна! Добро пожаловать!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Произошла ошибка при регистрации");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Регистрация
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Создайте аккаунт для использования Planner AI
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-foreground"
              >
                Имя
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
                className="mt-1"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="mt-1"
              />
            </div>

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-foreground"
              >
                Роль
              </label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Выберите роль" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{ROLE_NAMES.user}</SelectItem>
                  <SelectItem value="team_lead">{ROLE_NAMES.team_lead}</SelectItem>
                  <SelectItem value="admin">{ROLE_NAMES.admin}</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {ROLE_DESCRIPTIONS[role]}
              </p>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Пароль
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                className="mt-1"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-foreground"
              >
                Подтвердите пароль
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                className="mt-1"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Регистрация..." : "Зарегистрироваться"}
          </Button>

          <div className="text-center text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              Уже есть аккаунт?{" "}
            </span>
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link href="/login">
                Войти
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <Button variant="link" className="text-zinc-600 dark:text-zinc-400" asChild>
              <Link href="/">
                ← Вернуться на главную
              </Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
