import { desc, eq } from "drizzle-orm";
import { getDb, getTables } from "@/lib/db";
import type { Plan, PlanStep } from "@/lib/db/schema";

export type CreatePlanInput = {
  workCaptureId?: string | null;
  projectId?: string | null;
  title: string;
  goal?: string | null;
  context?: string | null;
  dueDate?: string | null;
  steps: string[];
};

export async function createPlanWithSteps(
  input: CreatePlanInput
): Promise<{ plan: Plan; steps: PlanStep[] }> {
  const db = getDb();
  const { plans, planSteps } = getTables();

  const [plan] = await db
    .insert(plans)
    .values({
      workCaptureId: input.workCaptureId ?? null,
      projectId: input.projectId ?? null,
      title: input.title.trim() || "（無題のPlan）",
      goal: input.goal?.trim() || null,
      context: input.context?.trim() || null,
      dueDate: input.dueDate?.trim() || null,
      status: "active",
    })
    .returning();

  const stepContents = input.steps.map((s) => s.trim()).filter(Boolean);
  let steps: PlanStep[] = [];
  if (stepContents.length > 0) {
    steps = await db
      .insert(planSteps)
      .values(
        stepContents.map((content, i) => ({
          planId: plan.id,
          content,
          sortOrder: i,
        }))
      )
      .returning();
  }

  return { plan, steps };
}

export async function getPlanWithSteps(planId: string) {
  const db = getDb();
  const { plans, planSteps } = getTables();

  const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  if (!plan) return null;

  const steps = await db
    .select()
    .from(planSteps)
    .where(eq(planSteps.planId, planId))
    .orderBy(planSteps.sortOrder);

  return { plan, steps };
}

export async function listPlansByProject(projectId: string): Promise<Plan[]> {
  const db = getDb();
  const { plans } = getTables();

  return db
    .select()
    .from(plans)
    .where(eq(plans.projectId, projectId))
    .orderBy(desc(plans.createdAt));
}
