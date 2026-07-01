/** Claude tool_use 用（null 非対応のため string / array） */
export const CLAUDE_TOOL_SCHEMA = {
  type: "object" as const,
  properties: {
    purpose: { type: "string", description: "目的。不明なら空文字" },
    background: { type: "string", description: "背景。不明なら空文字" },
    tasks: { type: "array", items: { type: "string" } },
    due_date: { type: "string", description: "期限。不明なら空文字" },
    action_plan: { type: "array", items: { type: "string" } },
    notes: { type: "array", items: { type: "string" } },
    decisions: { type: "array", items: { type: "string" } },
    next_action: { type: "string", description: "次の一歩。不明なら空文字" },
    uncertainties: { type: "array", items: { type: "string" } },
    project_candidates: { type: "array", items: { type: "string" } },
    context_candidates: { type: "array", items: { type: "string" } },
  },
  required: [
    "purpose",
    "background",
    "tasks",
    "due_date",
    "action_plan",
    "notes",
    "decisions",
    "next_action",
    "uncertainties",
    "project_candidates",
    "context_candidates",
  ],
};

/** Claude 出力を Zod スキーマ互換に正規化 */
export function normalizeStructuredOutput(parsed: Record<string, unknown>) {
  const emptyToNull = (v: unknown) => {
    if (typeof v === "string" && v.trim() === "") return null;
    return v;
  };

  return {
    purpose: emptyToNull(parsed.purpose),
    background: emptyToNull(parsed.background),
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    due_date: emptyToNull(parsed.due_date),
    action_plan: Array.isArray(parsed.action_plan) ? parsed.action_plan : [],
    notes: Array.isArray(parsed.notes) ? parsed.notes : [],
    decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
    next_action: emptyToNull(parsed.next_action),
    uncertainties: Array.isArray(parsed.uncertainties)
      ? parsed.uncertainties
      : [],
    project_candidates: Array.isArray(parsed.project_candidates)
      ? parsed.project_candidates
      : [],
    context_candidates: Array.isArray(parsed.context_candidates)
      ? parsed.context_candidates
      : [],
  };
}

export function parseApiErrorMessage(
  provider: string,
  status: number,
  body: string
): string {
  try {
    const json = JSON.parse(body);
    const msg =
      json.error?.message ??
      json.error?.message ??
      json.message ??
      body.slice(0, 200);
    if (status === 429) {
      return `${provider} の API クォータ超過（429）。しばらく待つか、別の AI を選択してください。`;
    }
    if (status === 401 || status === 403) {
      return `${provider} の API キーが無効です。環境変数を確認してください。`;
    }
    return `${provider} API エラー: ${msg}`;
  } catch {
    if (status === 429) {
      return `${provider} の API クォータ超過（429）。しばらく待つか、別の AI を選択してください。`;
    }
    return `${provider} API エラー (${status}): ${body.slice(0, 200)}`;
  }
}
