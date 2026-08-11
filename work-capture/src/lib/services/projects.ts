import { asc, desc, eq, inArray } from "drizzle-orm";
import { getDb, getTables } from "@/lib/db";
import type { Plan, PlanStep, Project, Task } from "@/lib/db/schema";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ProjectSummary = Project & {
  planCount: number;
  taskTotal: number;
  taskDone: number;
  /** projects.goal が空の場合に、紐づくPlanのgoalで補った表示用のGoal */
  displayGoal: string | null;
  /** 未完了タスクのうち最も近い期限 */
  nextDueDate: string | null;
};

export type ProjectPlanGroup = {
  plan: Plan;
  steps: PlanStep[];
  tasks: Task[];
};

export type ProjectDetail = {
  project: Project;
  planGroups: ProjectPlanGroup[];
  /** Projectには属すがPlanを持たないTask（単発Taskを後からProjectへ寄せた場合） */
  looseTasks: Task[];
  stats: { planCount: number; taskTotal: number; taskDone: number };
};

export async function listProjects(): Promise<Project[]> {
  const db = getDb();
  const { projects } = getTables();

  return db.select().from(projects).orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: string): Promise<Project | null> {
  if (!UUID_RE.test(id)) return null;

  const db = getDb();
  const { projects } = getTables();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  return project ?? null;
}

/** 一覧画面用。Project ごとの Plan 数・Task の進捗をまとめて返す。 */
export async function listProjectSummaries(): Promise<ProjectSummary[]> {
  const db = getDb();
  const { projects, plans, tasks } = getTables();

  const [projectRows, planRows, taskRows]: [
    Project[],
    { projectId: string | null; goal: string | null }[],
    { projectId: string | null; status: string; dueDate: string | null }[],
  ] = await Promise.all([
    db.select().from(projects).orderBy(desc(projects.createdAt)),
    db
      .select({ projectId: plans.projectId, goal: plans.goal })
      .from(plans)
      .orderBy(asc(plans.createdAt)),
    db
      .select({
        projectId: tasks.projectId,
        status: tasks.status,
        dueDate: tasks.dueDate,
      })
      .from(tasks),
  ]);

  return projectRows.map((project) => {
    const relatedPlans = planRows.filter((p) => p.projectId === project.id);
    const relatedTasks = taskRows.filter((t) => t.projectId === project.id);

    const dueDates = relatedTasks
      .filter((t) => t.status !== "done")
      .map((t) => t.dueDate?.trim())
      .filter((d): d is string => Boolean(d))
      .sort();

    return {
      ...project,
      planCount: relatedPlans.length,
      taskTotal: relatedTasks.length,
      taskDone: relatedTasks.filter((t) => t.status === "done").length,
      displayGoal:
        project.goal?.trim() ||
        relatedPlans.find((p) => p.goal?.trim())?.goal?.trim() ||
        null,
      nextDueDate: dueDates[0] ?? null,
    };
  });
}

/** 詳細画面用。Goal → Plan → Steps → Tasks を辿れる形にまとめて返す。 */
export async function getProjectDetail(
  id: string
): Promise<ProjectDetail | null> {
  const project = await getProjectById(id);
  if (!project) return null;

  const db = getDb();
  const { plans, planSteps, tasks } = getTables();

  const [planRows, taskRows]: [Plan[], Task[]] = await Promise.all([
    db
      .select()
      .from(plans)
      .where(eq(plans.projectId, project.id))
      .orderBy(asc(plans.createdAt)),
    db.select().from(tasks).where(eq(tasks.projectId, project.id)),
  ]);

  const planIds = planRows.map((p) => p.id);
  const stepRows: PlanStep[] =
    planIds.length > 0
      ? await db
          .select()
          .from(planSteps)
          .where(inArray(planSteps.planId, planIds))
          .orderBy(asc(planSteps.sortOrder))
      : [];

  const planGroups: ProjectPlanGroup[] = planRows.map((plan) => ({
    plan,
    steps: stepRows.filter((s) => s.planId === plan.id),
    tasks: taskRows.filter((t) => t.planId === plan.id),
  }));

  return {
    project,
    planGroups,
    looseTasks: taskRows.filter((t) => !t.planId),
    stats: {
      planCount: planRows.length,
      taskTotal: taskRows.length,
      taskDone: taskRows.filter((t) => t.status === "done").length,
    },
  };
}

/**
 * project名の文字列から既存Projectを再利用、なければ新規作成する。
 * 空文字/未指定なら null を返す（Projectは任意という設計方針）。
 */
export async function resolveProjectId(
  titleOrId: string | null | undefined
): Promise<string | null> {
  const value = titleOrId?.trim();
  if (!value) return null;

  const db = getDb();
  const { projects } = getTables();

  if (UUID_RE.test(value)) {
    const [byId] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, value))
      .limit(1);
    if (byId) return byId.id;
  }

  const [byTitle] = await db
    .select()
    .from(projects)
    .where(eq(projects.title, value))
    .limit(1);
  if (byTitle) return byTitle.id;

  const [created] = await db
    .insert(projects)
    .values({ title: value, status: "active" })
    .returning();
  return created.id;
}
