"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  leadId: string;
  memberIds: string[];
}

export default function ManageTeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    loadTeamData();
  }, [resolvedParams.teamId]);

  const loadTeamData = async () => {
    try {
      // Load team details
      const teamResponse = await fetch(`/api/teams/${resolvedParams.teamId}`);
      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeam(teamData.team);
      }

      // Load available users
      const usersResponse = await fetch(`/api/teams/${resolvedParams.teamId}/members`);
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setAvailableUsers(usersData.users);
      }
    } catch (error) {
      console.error("Load team data error:", error);
      setError("Ошибка при загрузке данных команды");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (team && availableUsers.length > 0) {
      const teamMembers = availableUsers.filter((user) =>
        team.memberIds.includes(user.id)
      );
      setMembers(teamMembers);
    }
  }, [team, availableUsers]);

  const handleAddMember = async () => {
    if (!selectedUserId) {
      setError("Выберите пользователя");
      return;
    }

    setError("");
    setSuccess("");
    setIsActionLoading(true);

    try {
      const response = await fetch(`/api/teams/${resolvedParams.teamId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: selectedUserId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка при добавлении участника");
        return;
      }

      setSuccess("Участник успешно добавлен");
      setSelectedUserId("");
      await loadTeamData();
    } catch (error) {
      console.error("Add member error:", error);
      setError("Произошла ошибка при добавлении участника");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этого участника из команды?")) {
      return;
    }

    setError("");
    setSuccess("");
    setIsActionLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${resolvedParams.teamId}/members?userId=${userId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка при удалении участника");
        return;
      }

      setSuccess("Участник успешно удален");
      await loadTeamData();
    } catch (error) {
      console.error("Remove member error:", error);
      setError("Произошла ошибка при удалении участника");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (
      !confirm(
        "Вы уверены, что хотите удалить эту команду? Это действие нельзя отменить."
      )
    ) {
      return;
    }

    setIsActionLoading(true);

    try {
      const response = await fetch(`/api/teams/${resolvedParams.teamId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Ошибка при удалении команды");
        return;
      }

      router.push("/dashboard/teams");
      router.refresh();
    } catch (error) {
      console.error("Delete team error:", error);
      setError("Произошла ошибка при удалении команды");
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg text-foreground">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg text-foreground">Команда не найдена</div>
          <Link
            href="/dashboard/teams"
            className="mt-4 inline-block text-sm text-zinc-600 hover:text-foreground"
          >
            ← Назад к командам
          </Link>
        </div>
      </div>
    );
  }

  const nonMembers = availableUsers.filter(
    (user) => !team.memberIds.includes(user.id) && user.id !== team.leadId
  );

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <Link
            href="/dashboard/teams"
            className="text-sm font-medium text-zinc-600 hover:text-foreground dark:text-zinc-400"
          >
            ← Назад к командам
          </Link>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground">
            Управление командой: {team.name}
          </h1>
          {team.description && (
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              {team.description}
            </p>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
            {success}
          </div>
        )}

        {/* Add Member Section */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold text-foreground">
            Добавить участника
          </h2>
          <div className="mt-4 flex gap-4">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-foreground focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              disabled={isActionLoading}
            >
              <option value="">Выберите пользователя</option>
              {nonMembers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            <button
              onClick={handleAddMember}
              disabled={isActionLoading || !selectedUserId}
              className="rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Добавить
            </button>
          </div>
        </div>

        {/* Current Members */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold text-foreground">
            Участники команды ({members.length})
          </h2>
          {members.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              В команде пока нет участников
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                >
                  <div>
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {member.email}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={isActionLoading}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-900/20">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-400">
            Опасная зона
          </h2>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">
            Удаление команды необратимо. Все участники будут удалены из команды.
          </p>
          <button
            onClick={handleDeleteTeam}
            disabled={isActionLoading}
            className="mt-4 rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Удалить команду
          </button>
        </div>
      </div>
    </div>
  );
}
