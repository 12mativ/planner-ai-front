// Role types for the application
export type UserRole = "admin" | "team_lead" | "user";

// Team structure
export interface Team {
  id: string;
  name: string;
  description: string;
  leadId: string; // User ID of the team lead
  memberIds: string[]; // Array of user IDs
  createdAt: Date;
  updatedAt: Date;
}

// User with role information
export interface UserWithRole {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  teamIds: string[]; // Teams the user belongs to
}

// Role permissions
export const ROLE_PERMISSIONS = {
  admin: {
    canViewAllUsers: true,
    canViewAllTeams: true,
    canCreateTeams: true,
    canDeleteTeams: true,
    canManageUsers: true,
    canChangeRoles: true,
  },
  team_lead: {
    canViewAllUsers: false,
    canViewAllTeams: false,
    canCreateTeams: true,
    canDeleteTeams: true, // Only their own teams
    canManageUsers: true, // Only in their teams
    canChangeRoles: false,
  },
  user: {
    canViewAllUsers: false,
    canViewAllTeams: false,
    canCreateTeams: false,
    canDeleteTeams: false,
    canManageUsers: false,
    canChangeRoles: false,
  },
} as const;

// Helper function to check permissions
export function hasPermission(
  role: UserRole,
  permission: keyof typeof ROLE_PERMISSIONS.admin
): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

// Role display names in Russian
export const ROLE_NAMES: Record<UserRole, string> = {
  admin: "Глобальный администратор",
  team_lead: "Тимлид",
  user: "Пользователь",
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: "Полный доступ ко всем функциям системы",
  team_lead: "Может создавать команды и управлять участниками",
  user: "Может участвовать в командах",
};
