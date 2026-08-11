import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const workCaptures = sqliteTable("work_captures", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  audioUrl: text("audio_url"),
  transcriptText: text("transcript_text"),
  inputType: text("input_type").notNull(),
  status: text("status").notNull().default("transcribed"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const aiParseResults = sqliteTable("ai_parse_results", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  workCaptureId: text("work_capture_id")
    .notNull()
    .references(() => workCaptures.id),
  rawOutput: text("raw_output"),
  parsedJson: text("parsed_json", { mode: "json" }),
  validationStatus: text("validation_status").notNull(),
  validationErrors: text("validation_errors", { mode: "json" }),
  modelName: text("model_name"),
  promptVersion: text("prompt_version"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const structuredItems = sqliteTable("structured_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  workCaptureId: text("work_capture_id")
    .notNull()
    .references(() => workCaptures.id),
  type: text("type").notNull(),
  content: text("content").notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const projects = sqliteTable("projects", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  goal: text("goal"),
  kind: text("kind"),
  status: text("status").notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export const plans = sqliteTable("plans", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id").references(() => projects.id),
  workCaptureId: text("work_capture_id").references(() => workCaptures.id),
  title: text("title").notNull(),
  goal: text("goal"),
  context: text("context"),
  dueDate: text("due_date"),
  status: text("status").notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const planSteps = sqliteTable("plan_steps", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  planId: text("plan_id")
    .notNull()
    .references(() => plans.id),
  content: text("content").notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const results = sqliteTable("results", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  plannedMinutes: integer("planned_minutes"),
  actualMinutes: integer("actual_minutes"),
  unexpected: text("unexpected"),
  nextTimeChange: text("next_time_change"),
  detail: text("detail", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const tasks = sqliteTable("tasks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  workCaptureId: text("work_capture_id").references(() => workCaptures.id),
  planId: text("plan_id").references(() => plans.id),
  projectId: text("project_id").references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("due_date"),
  priority: text("priority"),
  status: text("status").notNull().default("todo"),
  project: text("project"),
  context: text("context"),
  assignedTo: text("assigned_to"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type WorkCapture = typeof workCaptures.$inferSelect;
export type StructuredItem = typeof structuredItems.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type AiParseResult = typeof aiParseResults.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type PlanStep = typeof planSteps.$inferSelect;
export type Result = typeof results.$inferSelect;

export const sqliteSchema = {
  workCaptures,
  aiParseResults,
  structuredItems,
  tasks,
  projects,
  plans,
  planSteps,
  results,
};
