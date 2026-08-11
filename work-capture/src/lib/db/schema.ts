import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const workCaptures = pgTable("work_captures", {
  id: uuid("id").primaryKey().defaultRandom(),
  audioUrl: text("audio_url"),
  transcriptText: text("transcript_text"),
  inputType: text("input_type").notNull(),
  status: text("status").notNull().default("transcribed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiParseResults = pgTable("ai_parse_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  workCaptureId: uuid("work_capture_id")
    .references(() => workCaptures.id)
    .notNull(),
  rawOutput: text("raw_output"),
  parsedJson: jsonb("parsed_json"),
  validationStatus: text("validation_status").notNull(),
  validationErrors: jsonb("validation_errors"),
  modelName: text("model_name"),
  promptVersion: text("prompt_version"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const structuredItems = pgTable("structured_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  workCaptureId: uuid("work_capture_id")
    .references(() => workCaptures.id)
    .notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  goal: text("goal"),
  kind: text("kind"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id),
  workCaptureId: uuid("work_capture_id").references(() => workCaptures.id),
  title: text("title").notNull(),
  goal: text("goal"),
  context: text("context"),
  dueDate: text("due_date"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const planSteps = pgTable("plan_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id")
    .references(() => plans.id)
    .notNull(),
  content: text("content").notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const results = pgTable("results", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .references(() => projects.id)
    .notNull(),
  plannedMinutes: integer("planned_minutes"),
  actualMinutes: integer("actual_minutes"),
  unexpected: text("unexpected"),
  nextTimeChange: text("next_time_change"),
  detail: jsonb("detail"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  workCaptureId: uuid("work_capture_id").references(() => workCaptures.id),
  planId: uuid("plan_id").references(() => plans.id),
  projectId: uuid("project_id").references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("due_date"),
  priority: text("priority"),
  status: text("status").notNull().default("todo"),
  project: text("project"),
  context: text("context"),
  assignedTo: text("assigned_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WorkCapture = typeof workCaptures.$inferSelect;
export type StructuredItem = typeof structuredItems.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type AiParseResult = typeof aiParseResults.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type PlanStep = typeof planSteps.$inferSelect;
export type Result = typeof results.$inferSelect;
