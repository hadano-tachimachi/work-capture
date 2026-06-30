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

export const tasks = sqliteTable("tasks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  workCaptureId: text("work_capture_id").references(() => workCaptures.id),
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

export const sqliteSchema = {
  workCaptures,
  aiParseResults,
  structuredItems,
  tasks,
};
