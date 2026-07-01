import { NextResponse } from "next/server";
import { listTasks, parseTaskStatus, type TaskStatus } from "@/lib/services/tasks";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    let statuses: TaskStatus[] = ["todo", "on_hold"];
    if (statusParam) {
      statuses = statusParam
        .split(",")
        .map((s) => parseTaskStatus(s.trim()))
        .filter((s): s is TaskStatus => s !== null);

      if (statuses.length === 0) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
    }

    const tasks = await listTasks(statuses);
    return NextResponse.json({ tasks });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
