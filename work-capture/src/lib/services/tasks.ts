import { eq, inArray } from "drizzle-orm";
import { getDb, getTables } from "@/lib/db";
import type { StructuredItem, Task } from "@/lib/db/schema";

const PRIORITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export type TaskStatus = "todo" | "on_hold" | "done";

export type TaskListItem = Task;

export type TaskDetail = {
  task: Task;
  nextAction: string | null;
  notes: string[];
};

function sortTasks(rows: Task[]): Task[] {
  return [...rows].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority ?? "medium"] ?? 1;
    const pb = PRIORITY_ORDER[b.priority ?? "medium"] ?? 1;
    if (pa !== pb) return pa - pb;

    const dueA = a.dueDate ?? "\uffff";
    const dueB = b.dueDate ?? "\uffff";
    if (dueA !== dueB) return dueA.localeCompare(dueB);

    return (
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  });
}

export async function listTasks(
  statuses: TaskStatus[] = ["todo", "on_hold"]
): Promise<Task[]> {
  const db = getDb();
  const { tasks } = getTables();

  const rows = await db
    .select()
    .from(tasks)
    .where(inArray(tasks.status, statuses));

  return sortTasks(rows);
}

export async function getTaskCounts(): Promise<{
  todo: number;
  onHold: number;
  active: number;
}> {
  const db = getDb();
  const { tasks } = getTables();

  const rows: { status: string }[] = await db
    .select({ status: tasks.status })
    .from(tasks)
    .where(inArray(tasks.status, ["todo", "on_hold"]));

  const todo = rows.filter((r) => r.status === "todo").length;
  const onHold = rows.filter((r) => r.status === "on_hold").length;

  return { todo, onHold, active: todo + onHold };
}

export async function getTaskById(id: string): Promise<TaskDetail | null> {
  const db = getDb();
  const { tasks, structuredItems } = getTables();

  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!task) return null;

  let nextAction: string | null = null;
  let notes: string[] = [];

  if (task.workCaptureId) {
    const items: StructuredItem[] = await db
      .select()
      .from(structuredItems)
      .where(eq(structuredItems.workCaptureId, task.workCaptureId));

    nextAction =
      items.find((i) => i.type === "next_action")?.content ?? null;
    notes = items
      .filter((i) => i.type === "note")
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((i) => i.content);
  }

  return { task, nextAction, notes };
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const db = getDb();
  const { tasks } = getTables();

  const [updated] = await db
    .update(tasks)
    .set({ status })
    .where(eq(tasks.id, id))
    .returning();

  if (!updated) {
    throw new Error("Task not found");
  }

  return updated;
}

export function parseTaskStatus(value: unknown): TaskStatus | null {
  if (value === "todo" || value === "on_hold" || value === "done") {
    return value;
  }
  return null;
}
