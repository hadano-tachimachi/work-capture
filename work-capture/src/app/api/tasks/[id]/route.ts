import { NextResponse } from "next/server";
import {
  deleteTask,
  getTaskById,
  parseTaskStatus,
  updateTaskStatus,
} from "@/lib/services/tasks";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await getTaskById(id);

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const status = parseTaskStatus(body.status);

    if (!status) {
      return NextResponse.json(
        { error: "status must be todo, on_hold, or done" },
        { status: 400 }
      );
    }

    const task = await updateTaskStatus(id, status);
    return NextResponse.json({ task });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update";
    const status = message === "Task not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const task = await deleteTask(id);
    return NextResponse.json({ task });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete";
    const status = message === "Task not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
