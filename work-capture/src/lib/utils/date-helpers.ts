import {
  addDays,
  addWeeks,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { ja } from "date-fns/locale";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const WEEKDAY_OFFSET: Record<string, number> = {
  月: 0,
  火: 1,
  水: 2,
  木: 3,
  金: 4,
  土: 5,
  日: 6,
};

export function isIsoDateString(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  return isValid(parseISO(value));
}

/** 「今週末」「金曜まで」などを YYYY-MM-DD に変換（変換不可なら null） */
export function resolveAbstractDueDate(
  text: string,
  referenceDate: Date = new Date()
): string | null {
  const raw = text.trim();
  if (!raw) return null;
  if (isIsoDateString(raw)) return raw;

  const today = startOfDay(referenceDate);

  if (/^今日/u.test(raw)) return toIsoDateString(today);
  if (/^明日/u.test(raw)) return toIsoDateString(addDays(today, 1));
  if (/^明後日/u.test(raw)) return toIsoDateString(addDays(today, 2));

  const ymd = raw.match(/(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})/u);
  if (ymd) {
    const d = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
    return isValid(d) ? toIsoDateString(d) : null;
  }

  const md = raw.match(/(\d{1,2})月(\d{1,2})日/u);
  if (md) {
    let d = new Date(
      today.getFullYear(),
      Number(md[1]) - 1,
      Number(md[2])
    );
    if (d < today) {
      d = new Date(today.getFullYear() + 1, Number(md[1]) - 1, Number(md[2]));
    }
    return isValid(d) ? toIsoDateString(d) : null;
  }

  if (/今週末|週末/u.test(raw)) {
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    let saturday = addDays(weekStart, 5);
    if (saturday < today) saturday = addDays(saturday, 7);
    return toIsoDateString(saturday);
  }

  if (/来週末/u.test(raw)) {
    const nextWeekStart = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
    return toIsoDateString(addDays(nextWeekStart, 5));
  }

  if (/今週中/u.test(raw)) {
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const friday = addDays(weekStart, 4);
    return toIsoDateString(friday < today ? today : friday);
  }

  if (/^来週$/u.test(raw)) {
    return toIsoDateString(startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 }));
  }

  const weekDayMatch = raw.match(
    /(今週|来週)?(?:の)?([月火水木金土日])(?:曜日?)?(?:まで)?/u
  );
  if (weekDayMatch) {
    const scope = weekDayMatch[1] ?? "";
    const offset = WEEKDAY_OFFSET[weekDayMatch[2]];
    if (offset === undefined) return null;

    const weekOffset = scope === "来週" ? 1 : 0;
    const weekStart = startOfWeek(addWeeks(today, weekOffset), {
      weekStartsOn: 1,
    });
    let target = addDays(weekStart, offset);

    if (!scope && target < today) {
      target = addDays(
        startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 }),
        offset
      );
    }
    if (scope === "今週" && target < today) return null;

    return toIsoDateString(target);
  }

  return null;
}

export function normalizeDueDateValue(value: string | null): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (isIsoDateString(trimmed)) return trimmed;
  return resolveAbstractDueDate(trimmed) ?? trimmed;
}

export function parseDueDateValue(value: string): Date | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  const iso = isIsoDateString(trimmed)
    ? trimmed
    : resolveAbstractDueDate(trimmed);
  if (!iso) return undefined;

  const parsed = parseISO(iso);
  return isValid(parsed) ? parsed : undefined;
}

export function toIsoDateString(date: Date): string {
  return format(startOfDay(date), "yyyy-MM-dd");
}

export function formatDueDateDisplay(value: string): string {
  const trimmed = value?.trim();
  if (!trimmed) return "未設定";

  const iso = isIsoDateString(trimmed)
    ? trimmed
    : resolveAbstractDueDate(trimmed);
  if (iso) {
    return format(parseISO(iso), "yyyy年M月d日（E）", { locale: ja });
  }
  return trimmed;
}

export type DeadlinePreset = {
  label: string;
  iso: string;
};

export function getDeadlinePresets(): DeadlinePreset[] {
  const today = startOfDay(new Date());
  const nextWeekMonday = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });

  return [
    { label: "今日", iso: toIsoDateString(today) },
    { label: "明日", iso: toIsoDateString(addDays(today, 1)) },
    { label: "来週月", iso: toIsoDateString(nextWeekMonday) },
    { label: "未定", iso: "" },
  ];
}
