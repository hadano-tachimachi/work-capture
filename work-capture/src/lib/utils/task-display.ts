import {
  formatDueDateDisplay,
  isIsoDateString,
  normalizeDueDateValue,
  toIsoDateString,
} from "@/lib/utils/date-helpers";

export function priorityLabel(priority: string | null | undefined): string {
  switch (priority) {
    case "high":
      return "高";
    case "low":
      return "低";
    default:
      return "中";
  }
}

export function formatTaskDueDateShort(dueDate: string | null | undefined): string {
  if (!dueDate?.trim()) return "なし";

  const normalized = normalizeDueDateValue(dueDate);
  if (!normalized) return dueDate;

  if (isIsoDateString(normalized)) {
    const today = toIsoDateString(new Date());
    if (normalized === today) return "今日";
    return formatDueDateDisplay(normalized).replace(/（.+）$/, "");
  }

  return dueDate;
}
