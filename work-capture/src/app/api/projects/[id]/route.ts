import { NextResponse } from "next/server";
import { getProjectDetail } from "@/lib/services/projects";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const detail = await getProjectDetail(id);

    if (!detail) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch project",
      },
      { status: 500 }
    );
  }
}
