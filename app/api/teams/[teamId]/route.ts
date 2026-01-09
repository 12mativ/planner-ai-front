import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTeamById, deleteTeam } from "@/lib/auth";

// GET /api/teams/[teamId] - Get team details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { teamId } = await params;
    const team = await getTeamById(teamId);

    if (!team) {
      return NextResponse.json({ error: "Команда не найдена" }, { status: 404 });
    }

    const { role, id } = session.user;

    // Check permissions
    if (
      role !== "admin" &&
      team.leadId !== id &&
      !team.memberIds.includes(id)
    ) {
      return NextResponse.json(
        { error: "Недостаточно прав" },
        { status: 403 }
      );
    }

    return NextResponse.json({ team });
  } catch (error) {
    console.error("Get team error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении команды" },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[teamId] - Delete team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { teamId } = await params;
    const result = await deleteTeam(teamId, session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error("Delete team error:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении команды" },
      { status: 500 }
    );
  }
}
