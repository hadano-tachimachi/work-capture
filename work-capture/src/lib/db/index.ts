import Database from "better-sqlite3";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import fs from "fs";
import path from "path";
import { hasAnyProviderKey } from "@/lib/ai/providers/config";
import * as pgSchema from "./schema";
import { sqliteSchema } from "./schema-sqlite";

export type DbMode = "postgres" | "sqlite";

let mode: DbMode | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dbInstance: any = null;
let sqliteClient: Database.Database | null = null;

function ensureSqliteTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS work_captures (
      id TEXT PRIMARY KEY,
      audio_url TEXT,
      transcript_text TEXT,
      input_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'transcribed',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_parse_results (
      id TEXT PRIMARY KEY,
      work_capture_id TEXT NOT NULL REFERENCES work_captures(id),
      raw_output TEXT,
      parsed_json TEXT,
      validation_status TEXT NOT NULL,
      validation_errors TEXT,
      model_name TEXT,
      prompt_version TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS structured_items (
      id TEXT PRIMARY KEY,
      work_capture_id TEXT NOT NULL REFERENCES work_captures(id),
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      work_capture_id TEXT REFERENCES work_captures(id),
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      priority TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      project TEXT,
      context TEXT,
      assigned_to TEXT,
      created_at INTEGER NOT NULL
    );
  `);
}

export function getDbMode(): DbMode {
  if (mode) return mode;
  if (process.env.DATABASE_URL) {
    mode = "postgres";
  } else if (process.env.NODE_ENV === "development") {
    mode = "sqlite";
  } else {
    throw new Error(
      "DATABASE_URL が未設定です。Neon の接続文字列を .env.local に設定してください。"
    );
  }
  return mode;
}

export function isDevFallback(): boolean {
  return getDbMode() === "sqlite" || !hasAnyProviderKey();
}

export function getDb() {
  if (dbInstance) return dbInstance;

  if (getDbMode() === "postgres") {
    const sql = neon(process.env.DATABASE_URL!);
    dbInstance = drizzleNeon(sql, { schema: pgSchema });
    return dbInstance;
  }

  const dataDir = path.join(process.cwd(), ".data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  sqliteClient = new Database(path.join(dataDir, "work-capture.db"));
  ensureSqliteTables(sqliteClient);
  dbInstance = drizzleSqlite(sqliteClient, { schema: sqliteSchema });
  return dbInstance;
}

export function getTables() {
  return getDbMode() === "postgres" ? pgSchema : sqliteSchema;
}

export * from "./schema";
