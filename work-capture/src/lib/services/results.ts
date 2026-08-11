import { desc, eq } from "drizzle-orm";
import { getDb, getTables } from "@/lib/db";
import type { Result } from "@/lib/db/schema";

export type ResultDetail = {
  equipment?: string;
  location?: string;
  revisionCount?: number;
  attendees?: string;
  [key: string]: unknown;
};

export type CreateResultInput = {
  projectId: string;
  plannedMinutes?: number | null;
  actualMinutes?: number | null;
  unexpected?: string | null;
  nextTimeChange?: string | null;
  detail?: ResultDetail | null;
};

export async function createResult(input: CreateResultInput): Promise<Result> {
  const db = getDb();
  const { results } = getTables();

  const [row] = await db
    .insert(results)
    .values({
      projectId: input.projectId,
      plannedMinutes: input.plannedMinutes ?? null,
      actualMinutes: input.actualMinutes ?? null,
      unexpected: input.unexpected?.trim() || null,
      nextTimeChange: input.nextTimeChange?.trim() || null,
      detail: input.detail ?? null,
    })
    .returning();

  return row;
}

export async function listResultsByProject(
  projectId: string
): Promise<Result[]> {
  const db = getDb();
  const { results } = getTables();

  return db
    .select()
    .from(results)
    .where(eq(results.projectId, projectId))
    .orderBy(desc(results.createdAt));
}

/** Learn 用: 同じ kind の過去 Result を、紐づく Project タイトル付きで返す */
export async function listResultsByKind(
  kind: string,
  limit = 5
): Promise<
  Array<{
    result: Result;
    projectTitle: string;
    projectGoal: string | null;
  }>
> {
  const db = getDb();
  const { results, projects } = getTables();

  const rows: Array<{
    result: Result;
    projectTitle: string;
    projectGoal: string | null;
    kind: string | null;
  }> = await db
    .select({
      result: results,
      projectTitle: projects.title,
      projectGoal: projects.goal,
      kind: projects.kind,
    })
    .from(results)
    .innerJoin(projects, eq(results.projectId, projects.id))
    .orderBy(desc(results.createdAt));

  return rows
    .filter((r) => (r.kind ?? "").trim() === kind.trim())
    .slice(0, limit)
    .map(({ result, projectTitle, projectGoal }) => ({
      result,
      projectTitle,
      projectGoal,
    }));
}

export function parseOptionalMinutes(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}
