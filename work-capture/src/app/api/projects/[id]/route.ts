import { NextResponse } from "next/server";
import {
  getProjectDetail,
  parseProjectStatus,
  updateProjectMeta,
  updateProjectStatus,
} from "@/lib/services/projects";

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

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (body.status !== undefined) {
      const status = parseProjectStatus(body.status);
      if (!status) {
        return NextResponse.json(
          { error: "status must be active, done, or archived" },
          { status: 400 }
        );
      }
      const project = await updateProjectStatus(id, status);
      return NextResponse.json({ project });
    }

    if (
      body.kind !== undefined ||
      body.goal !== undefined ||
      body.title !== undefined
    ) {
      const project = await updateProjectMeta(id, {
        kind: body.kind,
        goal: body.goal,
        title: body.title,
      });
      return NextResponse.json({ project });
    }

    return NextResponse.json(
      { error: "No updatable fields provided" },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update project";
    const status = message === "Project not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
