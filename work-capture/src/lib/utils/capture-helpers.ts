export function isMobileUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return /android|iphone|ipad|ipod|mobile/i.test(userAgent);
}

export function groupItemsByType(
  items: Array<{ type: string; content: string; sortOrder: number | null }>
) {
  const grouped: Record<string, string[]> = {};
  for (const item of items) {
    if (!grouped[item.type]) grouped[item.type] = [];
    grouped[item.type].push(item.content);
  }
  return grouped;
}

export const MIN_RECORDING_SECONDS = 2;

export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}日前`;
  return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
}

export const ITEM_TYPE_LABELS: Record<string, string> = {
  purpose: "目的",
  background: "背景",
  task: "タスク",
  action: "アクションプラン",
  note: "メモ",
  decision: "判断事項",
  due_date: "期限",
  next_action: "次の一歩",
  uncertainty: "不明点",
  project_candidate: "Project候補",
  context_candidate: "Context候補",
};
