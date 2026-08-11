import { eq, inArray } from "drizzle-orm";
import { getDb, getTables } from "@/lib/db";
import type { StructuredItem, Task } from "@/lib/db/schema";

const PRIORITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export type TaskStatus = "todo" | "on_hold" | "done";

/** 「なぜこのタスクがあるのか」を画面で辿れるように、所属Plan/Projectの名前を添えたTask */
export type TaskWithContext = Task & {
  planTitle: string | null;
  projectTitle: string | null;
};

export type TaskListItem = TaskWithContext;

export type TaskDetail = {
  task: TaskWithContext;
  nextAction: string | null;
  notes: string[];
};

type TaskContextRow = {
  task: Task;
  planTitle: string | null;
  projectTitle: string | null;
};

function withContext(row: TaskContextRow): TaskWithContext {
  return {
    ...row.task,
    planTitle: row.planTitle,
    projectTitle: row.projectTitle,
  };
}

function sortTasks<T extends Task>(rows: T[]): T[] {
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
): Promise<TaskWithContext[]> {
  const db = getDb();
  const { tasks, plans, projects } = getTables();

  const joined: TaskContextRow[] = await db
    .select({
      task: tasks,
      planTitle: plans.title,
      projectTitle: projects.title,
    })
    .from(tasks)
    .leftJoin(plans, eq(tasks.planId, plans.id))
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(inArray(tasks.status, statuses));

  const rows = joined.map(withContext);

  if (statuses.length === 1 && statuses[0] === "done") {
    return [...rows].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  return sortTasks(rows);
}

export async function getTaskCounts(): Promise<{
  todo: number;
  onHold: number;
  active: number;
  done: number;
}> {
  const db = getDb();
  const { tasks } = getTables();

  const rows: { status: string }[] = await db
    .select({ status: tasks.status })
    .from(tasks);

  const todo = rows.filter((r) => r.status === "todo").length;
  const onHold = rows.filter((r) => r.status === "on_hold").length;
  const done = rows.filter((r) => r.status === "done").length;

  return { todo, onHold, active: todo + onHold, done };
}

export async function getTaskById(id: string): Promise<TaskDetail | null> {
  const db = getDb();
  const { tasks, plans, projects, structuredItems } = getTables();

  const [row]: TaskContextRow[] = await db
    .select({
      task: tasks,
      planTitle: plans.title,
      projectTitle: projects.title,
    })
    .from(tasks)
    .leftJoin(plans, eq(tasks.planId, plans.id))
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(eq(tasks.id, id))
    .limit(1);
  if (!row) return null;

  const task = withContext(row);

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

export async function deleteTask(id: string) {
  const db = getDb();
  const { tasks } = getTables();

  const [deleted] = await db
    .delete(tasks)
    .where(eq(tasks.id, id))
    .returning();

  if (!deleted) {
    throw new Error("Task not found");
  }

  return deleted;
}

export function parseTaskStatus(value: unknown): TaskStatus | null {
  if (value === "todo" || value === "on_hold" || value === "done") {
    return value;
  }
  return null;
}
