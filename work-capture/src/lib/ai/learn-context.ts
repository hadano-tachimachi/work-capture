import { listResultsByKind } from "@/lib/services/results";
import { projectKindLabel } from "@/lib/utils/project-display";

export type WorkKind = "photography" | "website" | "meeting" | "personal";

export type LearnReference = {
  projectId: string;
  projectTitle: string;
  projectGoal: string | null;
  kind: WorkKind;
  plannedMinutes: number | null;
  actualMinutes: number | null;
  unexpected: string | null;
  nextTimeChange: string | null;
  detail: Record<string, unknown> | null;
};

const KIND_KEYWORDS: Array<{ kind: WorkKind; patterns: RegExp[] }> = [
  {
    kind: "photography",
    patterns: [
      /撮影/,
      /カメラ/,
      /スタジオ/,
      /レフ板/,
      /レンズ/,
      /写真/,
      /ロケ/,
    ],
  },
  {
    kind: "website",
    patterns: [
      /Web|WEB|ウェブ/,
      /サイト/,
      /コーポレート/,
      /LP/,
      /ホームページ/,
      /改修/,
      /デプロイ/,
      /ページ/,
    ],
  },
  {
    kind: "meeting",
    patterns: [/打合せ|打ち合わせ/, /会議/, /ミーティング/, /面談/, /MTG/i],
  },
  {
    kind: "personal",
    patterns: [/家事/, /買い物/, /掃除/, /洗濯/, /個人的/],
  },
];

export function inferWorkKind(
  transcript: string,
  hint?: string | null
): WorkKind | null {
  const normalizedHint = hint?.trim().toLowerCase();
  if (
    normalizedHint === "photography" ||
    normalizedHint === "website" ||
    normalizedHint === "meeting" ||
    normalizedHint === "personal"
  ) {
    return normalizedHint;
  }

  for (const { kind, patterns } of KIND_KEYWORDS) {
    if (patterns.some((p) => p.test(transcript))) {
      return kind;
    }
  }
  return null;
}

function formatMinutes(value: number | null): string {
  return value == null ? "—" : `${value}分`;
}

export function formatLearnReferenceLine(ref: LearnReference): string {
  const kindLabel = projectKindLabel(ref.kind) ?? ref.kind;
  const parts = [
    `【${kindLabel}】${ref.projectTitle}`,
    `見積 ${formatMinutes(ref.plannedMinutes)} / 実績 ${formatMinutes(ref.actualMinutes)}`,
  ];
  if (ref.nextTimeChange?.trim()) {
    parts.push(`次回: ${ref.nextTimeChange.trim()}`);
  } else if (ref.unexpected?.trim()) {
    parts.push(`想定外: ${ref.unexpected.trim()}`);
  }
  return parts.join(" — ");
}

export function buildLearnPromptSection(refs: LearnReference[]): string {
  if (refs.length === 0) return "";

  const blocks = refs.map((ref, index) => {
    const lines = [
      `### ${index + 1}. ${ref.projectTitle}`,
      `- 種類: ${projectKindLabel(ref.kind) ?? ref.kind}`,
    ];
    if (ref.projectGoal?.trim()) {
      lines.push(`- Goal: ${ref.projectGoal.trim()}`);
    }
    lines.push(
      `- 見積: ${formatMinutes(ref.plannedMinutes)} / 実績: ${formatMinutes(ref.actualMinutes)}`
    );
    if (ref.unexpected?.trim()) {
      lines.push(`- 想定外だったこと: ${ref.unexpected.trim()}`);
    }
    if (ref.nextTimeChange?.trim()) {
      lines.push(`- 次回変えたいこと: ${ref.nextTimeChange.trim()}`);
    }
    const detail = ref.detail ?? {};
    if (typeof detail.equipment === "string" && detail.equipment.trim()) {
      lines.push(`- 使用機材: ${detail.equipment.trim()}`);
    }
    if (typeof detail.location === "string" && detail.location.trim()) {
      lines.push(`- 現場: ${detail.location.trim()}`);
    }
    if (typeof detail.revisionCount === "number") {
      lines.push(`- 修正回数: ${detail.revisionCount}`);
    }
    if (typeof detail.attendees === "string" && detail.attendees.trim()) {
      lines.push(`- 参加者: ${detail.attendees.trim()}`);
    }
    return lines.join("\n");
  });

  return [
    "## 過去の同種の仕事から得た学び（Learn）",
    "以下は過去に完了した同種の仕事の振り返りです。",
    "action_plan の順序や、notes での所要時間の目安を考える参考にしてください。",
    "入力にない事実・タスク・人名を、過去実績から作り出さないでください。",
    "",
    ...blocks,
  ].join("\n");
}

export async function loadLearnReferences(
  transcript: string,
  kindHint?: string | null,
  limit = 3
): Promise<{ kind: WorkKind | null; references: LearnReference[] }> {
  const kind = inferWorkKind(transcript, kindHint);
  if (!kind) {
    return { kind: null, references: [] };
  }

  const rows = await listResultsByKind(kind, limit);
  const references: LearnReference[] = rows.map((row) => ({
    projectId: row.result.projectId,
    projectTitle: row.projectTitle,
    projectGoal: row.projectGoal,
    kind,
    plannedMinutes: row.result.plannedMinutes,
    actualMinutes: row.result.actualMinutes,
    unexpected: row.result.unexpected,
    nextTimeChange: row.result.nextTimeChange,
    detail: (row.result.detail as Record<string, unknown> | null) ?? null,
  }));

  return { kind, references };
}
