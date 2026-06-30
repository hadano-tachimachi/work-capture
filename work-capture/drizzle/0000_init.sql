CREATE TABLE IF NOT EXISTS "work_captures" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "audio_url" text,
  "transcript_text" text,
  "input_type" text NOT NULL,
  "status" text DEFAULT 'transcribed' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ai_parse_results" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "work_capture_id" uuid NOT NULL REFERENCES "work_captures"("id"),
  "raw_output" text,
  "parsed_json" jsonb,
  "validation_status" text NOT NULL,
  "validation_errors" jsonb,
  "model_name" text,
  "prompt_version" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "structured_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "work_capture_id" uuid NOT NULL REFERENCES "work_captures"("id"),
  "type" text NOT NULL,
  "content" text NOT NULL,
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "work_capture_id" uuid REFERENCES "work_captures"("id"),
  "title" text NOT NULL,
  "description" text,
  "due_date" text,
  "priority" text,
  "status" text DEFAULT 'todo' NOT NULL,
  "project" text,
  "context" text,
  "assigned_to" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
