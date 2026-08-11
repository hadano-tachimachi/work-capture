// 既存 tasks.project（テキスト）から projects レコードを起こし、
// 該当する tasks.project_id を紐づける移行スクリプト。
//
// 実行: node scripts/migrate-tasks-to-projects.mjs [--dry-run]
//
// 冪等性: 同名の project が既にあれば再作成せず、そのIDを再利用する。
// project_id が既にセットされている task はスキップする。

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const dryRun = process.argv.includes("--dry-run");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL が未設定です（.env.local を確認してください）");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const tasks = await sql`
    SELECT id, project, project_id
    FROM tasks
    WHERE project IS NOT NULL AND project != '' AND project_id IS NULL
  `;

  if (tasks.length === 0) {
    console.log("移行対象の task はありません（すでに移行済み、または project 未設定）。");
    return;
  }

  const projectTitles = [...new Set(tasks.map((t) => t.project))];
  console.log(`移行対象: task ${tasks.length}件 / 一意な project名 ${projectTitles.length}件`);
  console.log(projectTitles.map((t) => `  - ${t}`).join("\n"));

  if (dryRun) {
    console.log("\n--dry-run のため、実際の書き込みは行いません。");
    return;
  }

  const titleToProjectId = new Map();

  for (const title of projectTitles) {
    const existing = await sql`
      SELECT id FROM projects WHERE title = ${title} LIMIT 1
    `;
    if (existing.length > 0) {
      titleToProjectId.set(title, existing[0].id);
      console.log(`既存の project を再利用: "${title}" (${existing[0].id})`);
      continue;
    }
    const inserted = await sql`
      INSERT INTO projects (title, status)
      VALUES (${title}, 'active')
      RETURNING id
    `;
    titleToProjectId.set(title, inserted[0].id);
    console.log(`新規 project を作成: "${title}" (${inserted[0].id})`);
  }

  let updatedCount = 0;
  for (const title of projectTitles) {
    const projectId = titleToProjectId.get(title);
    const result = await sql`
      UPDATE tasks
      SET project_id = ${projectId}
      WHERE project = ${title} AND project_id IS NULL
    `;
    updatedCount += result.length ?? 0;
  }

  const check = await sql`
    SELECT count(*) FROM tasks WHERE project IS NOT NULL AND project != '' AND project_id IS NULL
  `;
  console.log(`\n完了: project ${titleToProjectId.size}件を作成/再利用、task ${updatedCount}件を紐づけ。`);
  console.log(`未紐づけの残件: ${check[0].count}件（0であれば全件紐づけ完了）`);
}

main().catch((err) => {
  console.error("移行スクリプトでエラーが発生しました:", err);
  process.exit(1);
});
