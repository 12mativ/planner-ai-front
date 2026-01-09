import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addTeamMember, removeTeamMember, getUsers } from "@/lib/auth";

// POST /api/teams/[teamId]/members - Add member to team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "ID пользователя обязателен" },
        { status: 400 }
      );
    }

    const { teamId } = await params;
    const result = await addTeamMember(teamId, userId, session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error("Add team member error:", error);
    return NextResponse.json(
      { error: "Ошибка при добавлении участника" },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[teamId]/members - Remove member from team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "ID пользователя обязателен" },
        { status: 400 }
      );
    }

    const { teamId } = await params;
    const result = await removeTeamMember(teamId, userId, session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error("Remove team member error:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении участника" },
      { status: 500 }
    );
  }
}

// GET /api/teams/[teamId]/members - Get available users to add
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Only team leads and admins can see available users
    if (session.user.role !== "team_lead" && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Недостаточно прав" },
        { status: 403 }
      );
    }

    // Await params even though we don't use teamId in this endpoint
    await params;

    const users = await getUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении пользователей" },
      { status: 500 }
    );
  }
}
