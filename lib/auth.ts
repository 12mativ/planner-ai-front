import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { UserRole, Team } from "@/types/roles";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          console.log("User not found:", credentials.email);
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          console.log("Invalid password for user:", credentials.email);
          return null;
        }

        console.log("User authenticated successfully:", user.email, "Role:", user.role);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

// Helper function to register a new user
export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: UserRole = "user"
): Promise<{ success: boolean; message: string }> {
  console.log("Registering user:", email, "with role:", role);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log("User already exists:", email);
    return { success: false, message: "Пользователь с таким email уже существует" };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
    },
  });

  console.log("User registered successfully:", email);
  return { success: true, message: "Регистрация успешна" };
}

// Helper function to get all users (for debugging)
export async function getUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      memberships: {
        select: {
          teamId: true,
        },
      },
    },
  });

  return users.map((user) => ({
    ...user,
    teamIds: user.memberships.map((m) => m.teamId),
  }));
}

// Helper function to get user by ID
export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      memberships: {
        select: {
          teamId: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    ...user,
    teamIds: user.memberships.map((m) => m.teamId),
  };
}

// Team management functions
export async function getTeams(): Promise<Team[]> {
  const teams = await prisma.team.findMany({
    include: {
      members: {
        select: {
          userId: true,
        },
      },
    },
  });

  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    description: team.description,
    leadId: team.leadId,
    memberIds: team.members.map((m) => m.userId),
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  }));
}

export async function getTeamsByLeadId(leadId: string): Promise<Team[]> {
  const teams = await prisma.team.findMany({
    where: { leadId },
    include: {
      members: {
        select: {
          userId: true,
        },
      },
    },
  });

  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    description: team.description,
    leadId: team.leadId,
    memberIds: team.members.map((m) => m.userId),
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  }));
}

export async function getTeamById(id: string): Promise<Team | null> {
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!team) return null;

  return {
    id: team.id,
    name: team.name,
    description: team.description,
    leadId: team.leadId,
    memberIds: team.members.map((m) => m.userId),
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  };
}

export async function createTeam(
  name: string,
  description: string,
  leadId: string
): Promise<{ success: boolean; message: string; team?: Team }> {
  const lead = await prisma.user.findUnique({ where: { id: leadId } });

  if (!lead || (lead.role !== "team_lead" && lead.role !== "admin")) {
    return { success: false, message: "Только тимлиды и администраторы могут создавать команды" };
  }

  const team = await prisma.team.create({
    data: {
      name,
      description,
      leadId,
    },
  });

  return {
    success: true,
    message: "Команда создана",
    team: {
      id: team.id,
      name: team.name,
      description: team.description,
      leadId: team.leadId,
      memberIds: [],
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    },
  };
}

export async function addTeamMember(
  teamId: string,
  userId: string,
  requesterId: string
): Promise<{ success: boolean; message: string }> {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    return { success: false, message: "Команда не найдена" };
  }

  const requester = await prisma.user.findUnique({ where: { id: requesterId } });
  if (!requester) {
    return { success: false, message: "Пользователь не найден" };
  }

  // Check permissions
  if (requester.role !== "admin" && team.leadId !== requesterId) {
    return { success: false, message: "Недостаточно прав" };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false, message: "Пользователь для добавления не найден" };
  }

  // Check if already a member
  const existingMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
  });

  if (existingMember) {
    return { success: false, message: "Пользователь уже в команде" };
  }

  await prisma.teamMember.create({
    data: {
      teamId,
      userId,
    },
  });

  return { success: true, message: "Пользователь добавлен в команду" };
}

export async function removeTeamMember(
  teamId: string,
  userId: string,
  requesterId: string
): Promise<{ success: boolean; message: string }> {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    return { success: false, message: "Команда не найдена" };
  }

  const requester = await prisma.user.findUnique({ where: { id: requesterId } });
  if (!requester) {
    return { success: false, message: "Пользователь не найден" };
  }

  // Check permissions
  if (requester.role !== "admin" && team.leadId !== requesterId) {
    return { success: false, message: "Недостаточно прав" };
  }

  await prisma.teamMember.deleteMany({
    where: {
      teamId,
      userId,
    },
  });

  return { success: true, message: "Пользователь удален из команды" };
}

export async function deleteTeam(
  teamId: string,
  requesterId: string
): Promise<{ success: boolean; message: string }> {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    return { success: false, message: "Команда не найдена" };
  }

  const requester = await prisma.user.findUnique({ where: { id: requesterId } });
  if (!requester) {
    return { success: false, message: "Пользователь не найден" };
  }

  // Check permissions
  if (requester.role !== "admin" && team.leadId !== requesterId) {
    return { success: false, message: "Недостаточно прав" };
  }

  // Delete team (cascade will delete members)
  await prisma.team.delete({
    where: { id: teamId },
  });

  return { success: true, message: "Команда удалена" };
}
