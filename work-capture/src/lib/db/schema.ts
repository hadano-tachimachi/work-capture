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

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  workCaptureId: uuid("work_capture_id").references(() => workCaptures.id),
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
