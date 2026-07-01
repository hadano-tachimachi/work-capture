"use client";

import { ja } from "date-fns/locale";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatDueDateDisplay,
  getDeadlinePresets,
  isIsoDateString,
  parseDueDateValue,
  resolveAbstractDueDate,
  toIsoDateString,
} from "@/lib/utils/date-helpers";

type DeadlinePickerProps = {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
  className?: string;
};

export function DeadlinePicker({
  value,
  onChange,
  compact = false,
  className,
}: DeadlinePickerProps) {
  const selected = parseDueDateValue(value);
  const presets = getDeadlinePresets();
  const aiHint =
    value.trim() &&
    !isIsoDateString(value) &&
    !resolveAbstractDueDate(value)
      ? value
      : null;
  const displayIso = selected ? toIsoDateString(selected) : "";

  return (
    <div className={cn("space-y-4", className)}>
      {aiHint && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-muted-foreground">
          AI 提案:{" "}
          <span className="font-medium text-foreground">{aiHint}</span>
          {" — カレンダーで具体日を選んでください"}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const isActive =
            preset.iso === ""
              ? !displayIso && !aiHint
              : displayIso === preset.iso;
          return (
            <Button
              key={preset.label}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(preset.iso)}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>

      <Calendar
        mode="single"
        locale={ja}
        selected={selected}
        onSelect={(date) => onChange(date ? toIsoDateString(date) : "")}
        className={cn("mx-auto rounded-xl border", compact && "p-2")}
      />

      <p className="text-center text-sm text-muted-foreground">
        {displayIso
          ? `選択中: ${formatDueDateDisplay(displayIso)}`
          : aiHint
            ? "具体日未設定"
            : "日付未設定"}
      </p>
    </div>
  );
}
