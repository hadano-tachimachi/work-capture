import { z } from "zod";

const structuredOutputSchema = z.object({
  purpose: z.string().nullable(),
  background: z.string().nullable(),
  tasks: z.array(z.string()),
  due_date: z.string().nullable(),
  action_plan: z.array(z.string()),
  notes: z.array(z.string()),
  decisions: z.array(z.string()),
  next_action: z.string().nullable(),
  uncertainties: z.array(z.string()),
  project_candidates: z.array(z.string()),
  context_candidates: z.array(z.string()),
});

const sample = {
  purpose: "山田さんの見積を作成し共有する",
  background: "山田さんから依頼があった",
  tasks: ["見積項目を入力する", "原価を調査する"],
  due_date: "今週中",
  action_plan: ["見積項目を入力する", "原価を調べる", "共有する"],
  notes: ["粗利は知らせた方が良い"],
  decisions: ["粗利をどのように伝えるか検討"],
  next_action: "見積項目を先に入力する",
  uncertainties: [],
  project_candidates: ["見積案件"],
  context_candidates: ["本業"],
};

const parsed = structuredOutputSchema.safeParse(sample);
if (!parsed.success) {
  console.error("Zod schema rejected valid sample");
  process.exit(1);
}

const invalid = structuredOutputSchema.safeParse({ tasks: "not-array" });
if (invalid.success) {
  console.error("Zod schema accepted invalid sample");
  process.exit(1);
}

console.log("✓ structure-schema validation passed");
