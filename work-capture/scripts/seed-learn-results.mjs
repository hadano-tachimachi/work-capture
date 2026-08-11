#!/usr/bin/env node
/**
 * Learn用の種データ（過去の実仕事 2〜3件）を Neon work-loop ブランチへ投入する。
 *
 * 使い方:
 *   node --env-file=.env.local scripts/seed-learn-results.mjs
 *   node --env-file=.env.local scripts/seed-learn-results.mjs --dry-run
 *
 * 冪等: 同じ title の Project が既にあればスキップ。
 */

import { neon } from "@neondatabase/serverless";

const DRY_RUN = process.argv.includes("--dry-run");

const SEEDS = [
  {
    title: "【種】Danielプロフィール撮影",
    goal: "プロフィール用の写真を納品できる状態にする",
    kind: "photography",
    plannedMinutes: 180,
    actualMinutes: 240,
    unexpected: "自然光が想定より弱く、レフ板の準備に時間がかかった",
    nextTimeChange: "屋外撮影の前日に光の向きを現地で確認する",
    detail: { equipment: "α7IV + 85mm", location: "公園の木陰" },
  },
  {
    title: "【種】コーポレートサイト簡易改修",
    goal: "トップとサービスページの文言・画像を差し替えて公開する",
    kind: "website",
    plannedMinutes: 300,
    actualMinutes: 420,
    unexpected: "差し替え画像の解像度不足で再書き出しが発生した",
    nextTimeChange: "素材依頼時に推奨サイズを最初に伝える",
    detail: { revisionCount: 2 },
  },
  {
    title: "【種】クライアント方針打合せ",
    goal: "次の制作スコープと優先順位を合意する",
    kind: "meeting",
    plannedMinutes: 60,
    actualMinutes: 90,
    unexpected: "議題が広がり、優先順位の決定が最後まで持ち越しになった",
    nextTimeChange: "事前に「決めたいこと」を3つまで絞って共有する",
    detail: { attendees: "クライアント2名 + 自分" },
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL がありません。.env.local を指定して実行してください。");
    process.exit(1);
  }

  const sql = neon(url);
  console.log(DRY_RUN ? "[dry-run]" : "[apply]", "seed learn results");

  for (const seed of SEEDS) {
    const existing = await sql`
      SELECT id FROM projects WHERE title = ${seed.title} LIMIT 1
    `;
    if (existing.length > 0) {
      console.log("skip (exists):", seed.title);
      continue;
    }

    if (DRY_RUN) {
      console.log("would create:", seed.title);
      continue;
    }

    const [project] = await sql`
      INSERT INTO projects (id, title, goal, kind, status, created_at, completed_at)
      VALUES (
        gen_random_uuid(),
        ${seed.title},
        ${seed.goal},
        ${seed.kind},
        'done',
        NOW(),
        NOW()
      )
      RETURNING id, title
    `;

    await sql`
      INSERT INTO results (
        id, project_id, planned_minutes, actual_minutes,
        unexpected, next_time_change, detail, created_at
      )
      VALUES (
        gen_random_uuid(),
        ${project.id},
        ${seed.plannedMinutes},
        ${seed.actualMinutes},
        ${seed.unexpected},
        ${seed.nextTimeChange},
        ${JSON.stringify(seed.detail)}::jsonb,
        NOW()
      )
    `;

    console.log("created:", project.title, project.id);
  }

  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
