import type { StructuredOutput } from "@/lib/validation/structure-schema";
import { hasAnyProviderKey } from "@/lib/ai/providers/config";
import { normalizeDueDateValue } from "@/lib/utils/date-helpers";

export const DEV_MODEL_NAME = "dev-mock";

function isDevMockEnabled() {
  return process.env.NODE_ENV === "development" && !hasAnyProviderKey();
}

function mockStructureFromText(transcript: string): StructuredOutput {
  const sentences = transcript
    .split(/[。．!\?？\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  const tasks = sentences.filter(
    (s) =>
      /する|したい|確認|連絡|作成|調べ|送|共有|入力|準備/.test(s) &&
      !/判断|よね|かな/.test(s)
  );
  const decisions = sentences.filter((s) =>
    /判断|よね|かな|どう|検討/.test(s)
  );
  const notes = sentences.filter(
    (s) =>
      !tasks.includes(s) &&
      !decisions.includes(s) &&
      /から|依頼|予定|まで|粗|一旦/.test(s)
  );

  const dueMatch = transcript.match(
    /(今週|来週|今日|明日|月末|\d+月\d+日|まで)/
  );

  return {
    purpose: sentences[0] ?? transcript.slice(0, 80),
    background: notes[0] ?? null,
    tasks: tasks.length > 0 ? tasks.slice(0, 6) : [sentences[0] ?? transcript],
    due_date: normalizeDueDateValue(dueMatch?.[0] ?? null),
    action_plan: tasks.slice(0, 5),
    notes: notes.length > 0 ? notes : [],
    decisions,
    next_action: tasks[0] ?? sentences[0] ?? null,
    uncertainties: [],
    project_candidates: [],
    context_candidates: [],
  };
}

export async function mockTranscribeAudio(): Promise<string> {
  return "（開発モード）音声入力を受け付けました。API キーを設定すると本番 AI が使えます。";
}

export async function mockStructureTranscript(
  transcript: string
): Promise<{ rawOutput: string; parsed: StructuredOutput }> {
  const parsed = mockStructureFromText(transcript);
  return { rawOutput: JSON.stringify(parsed, null, 2), parsed };
}

export function isUsingDevMock(): boolean {
  return isDevMockEnabled();
}
