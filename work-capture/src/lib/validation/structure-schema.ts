import { z } from "zod";

export const structuredOutputSchema = z.object({
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

export type StructuredOutput = z.infer<typeof structuredOutputSchema>;

export const STRUCTURED_ITEM_TYPES = [
  "purpose",
  "background",
  "task",
  "action",
  "note",
  "decision",
  "due_date",
  "next_action",
  "uncertainty",
  "project_candidate",
  "context_candidate",
] as const;

export type StructuredItemType = (typeof STRUCTURED_ITEM_TYPES)[number];

export function structuredOutputToItems(
  data: StructuredOutput
): Array<{ type: StructuredItemType; content: string; sortOrder: number }> {
  const items: Array<{
    type: StructuredItemType;
    content: string;
    sortOrder: number;
  }> = [];
  let order = 0;

  const push = (type: StructuredItemType, content: string | null) => {
    if (content?.trim()) {
      items.push({ type, content: content.trim(), sortOrder: order++ });
    }
  };

  const pushMany = (type: StructuredItemType, values: string[]) => {
    for (const value of values) {
      push(type, value);
    }
  };

  push("purpose", data.purpose);
  push("background", data.background);
  pushMany("task", data.tasks);
  push("due_date", data.due_date);
  pushMany("action", data.action_plan);
  pushMany("note", data.notes);
  pushMany("decision", data.decisions);
  push("next_action", data.next_action);
  pushMany("uncertainty", data.uncertainties);
  pushMany("project_candidate", data.project_candidates);
  pushMany("context_candidate", data.context_candidates);

  return items;
}
