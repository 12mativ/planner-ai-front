import { auth } from "@/lib/auth";

/**
 * Get the current session on the server side
 * Use this in Server Components and Server Actions
 */
export async function getSession() {
  return await auth();
}

/**
 * Check if user is authenticated
 * Returns true if user is logged in, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await auth();
  return !!session?.user;
}

/**
 * Get current user or null
 * Use this to get user information in Server Components
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Require authentication - throws error if not authenticated
 * Use this in Server Actions that require authentication
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized - Authentication required");
  }
  return session;
}
