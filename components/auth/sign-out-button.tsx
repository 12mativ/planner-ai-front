"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <button
      onClick={handleSignOut}
      className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-all hover:scale-105 hover:bg-zinc-800 dark:hover:bg-zinc-200"
    >
      Выйти
    </button>
  );
}
