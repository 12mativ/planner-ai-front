import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTeams, getTeamsByLeadId, createTeam } from "@/lib/auth";

// GET /api/teams - Get teams based on user role
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { role, id } = session.user;

    // Admin can see all teams
    if (role === "admin") {
      const teams = await getTeams();
      return NextResponse.json({ teams });
    }

    // Team lead can see only their teams
    if (role === "team_lead") {
      const teams = await getTeamsByLeadId(id);
      return NextResponse.json({ teams });
    }

    // Regular users can see teams they're part of
    const allTeams = await getTeams();
    const userTeams = allTeams.filter((team) => team.memberIds.includes(id));
    return NextResponse.json({ teams: userTeams });
  } catch (error) {
    console.error("Get teams error:", error);
    return NextResponse.json(
      { error: "Ошибка при получении команд" },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { role, id } = session.user;

    // Only team leads and admins can create teams
    if (role !== "team_lead" && role !== "admin") {
      return NextResponse.json(
        { error: "Недостаточно прав для создания команды" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Название команды обязательно" },
        { status: 400 }
      );
    }

    const result = await createTeam(name, description || "", id);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: result.message, team: result.team },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create team error:", error);
    return NextResponse.json(
      { error: "Ошибка при создании команды" },
      { status: 500 }
    );
  }
}
