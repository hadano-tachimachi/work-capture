import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/services/projects";
import {
  createResult,
  parseOptionalMinutes,
  type ResultDetail,
} from "@/lib/services/results";

type RouteContext = { params: Promise<{ id: string }> };

function buildDetail(
  kind: string | null | undefined,
  body: Record<string, unknown>
): ResultDetail | null {
  const detail: ResultDetail = {};

  if (kind === "photography") {
    if (typeof body.equipment === "string" && body.equipment.trim()) {
      detail.equipment = body.equipment.trim();
    }
    if (typeof body.location === "string" && body.location.trim()) {
      detail.location = body.location.trim();
    }
  } else if (kind === "website") {
    const revisionCount = parseOptionalMinutes(body.revisionCount);
    if (revisionCount !== null) detail.revisionCount = revisionCount;
  } else if (kind === "meeting") {
    if (typeof body.attendees === "string" && body.attendees.trim()) {
      detail.attendees = body.attendees.trim();
    }
  }

  return Object.keys(detail).length > 0 ? detail : null;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const result = await createResult({
      projectId: id,
      plannedMinutes: parseOptionalMinutes(body.plannedMinutes),
      actualMinutes: parseOptionalMinutes(body.actualMinutes),
      unexpected:
        typeof body.unexpected === "string" ? body.unexpected : null,
      nextTimeChange:
        typeof body.nextTimeChange === "string" ? body.nextTimeChange : null,
      detail: buildDetail(project.kind, body),
    });

    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create result",
      },
      { status: 500 }
    );
  }
}
