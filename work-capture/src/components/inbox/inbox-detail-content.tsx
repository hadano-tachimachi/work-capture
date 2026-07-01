"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionCard } from "@/components/shared/section-card";
import { ValidationFailedAlert } from "@/components/shared/validation-failed-alert";
import { SpeechInput } from "@/components/shared/speech-input";
import {
  formatRelativeTime,
  ITEM_TYPE_LABELS,
} from "@/lib/utils/capture-helpers";
import { formatDueDateDisplay } from "@/lib/utils/date-helpers";
import { cn } from "@/lib/utils";

type InboxDetailContentProps = {
  captureId?: string;
  transcript: string;
  inputType?: string;
  createdAt?: string;
  validationStatus: string;
  tasks: string[];
  memos: string[];
  nextAction: string;
  dueDate: string;
  assignedTo: string;
  priority: string;
  project: string;
  context: string;
  saving: boolean;
  compact?: boolean;
  getByType: (type: string) => string[];
  onOpenSheet: (sheet: "tasks" | "deadline" | "memo" | "next") => void;
  onAssignedToChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onProjectChange: (value: string) => void;
  onContextChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onAction: (action: "confirm" | "skip" | "delete") => void;
  className?: string;
};

export function InboxDetailContent({
  captureId,
  transcript,
  inputType,
  createdAt,
  validationStatus,
  tasks,
  memos,
  nextAction,
  dueDate,
  assignedTo,
  priority,
  project,
  context,
  saving,
  compact = false,
  getByType,
  onOpenSheet,
  onAssignedToChange,
  onPriorityChange,
  onProjectChange,
  onContextChange,
  onDueDateChange: _onDueDateChange,
  onAction,
  className,
}: InboxDetailContentProps) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const structureSection = (
    <div className="space-y-3">
      <ValidationFailedAlert
        captureId={captureId}
        validationStatus={validationStatus}
      />

      {getByType("uncertainty").length > 0 && (
        <SectionCard
          label={ITEM_TYPE_LABELS.uncertainty}
          preview={getByType("uncertainty").join(" / ")}
          interactive={false}
          variant="warning"
        />
      )}

      {getByType("purpose").length > 0 && (
        <SectionCard
          label={ITEM_TYPE_LABELS.purpose}
          preview={getByType("purpose")[0]}
          interactive={false}
        />
      )}

      {getByType("background").length > 0 && (
        <SectionCard
          label={ITEM_TYPE_LABELS.background}
          preview={getByType("background").join(" / ")}
          interactive={false}
        />
      )}

      <SectionCard
        label={ITEM_TYPE_LABELS.task}
        preview={
          tasks.length > 0 ? (
            <ul className="space-y-1">
              {tasks.map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-muted-foreground">□</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          ) : (
            "クリックしてタスクを追加"
          )
        }
        onClick={() => onOpenSheet("tasks")}
      />

      <SectionCard
        label={ITEM_TYPE_LABELS.due_date}
        preview={
          dueDate ? formatDueDateDisplay(dueDate) : "クリックして期限を設定"
        }
        onClick={() => onOpenSheet("deadline")}
      />

      <SectionCard
        label={ITEM_TYPE_LABELS.note}
        preview={memos.length > 0 ? memos.join(" / ") : "なし"}
        onClick={() => onOpenSheet("memo")}
      />

      {getByType("decision").length > 0 && (
        <SectionCard
          label={ITEM_TYPE_LABELS.decision}
          preview={getByType("decision").join(" / ")}
          interactive={false}
        />
      )}

      <SectionCard
        label={ITEM_TYPE_LABELS.next_action}
        preview={nextAction || "クリックして次の一歩を選択"}
        onClick={() => onOpenSheet("next")}
      />
    </div>
  );

  const confirmFields = (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>担当</Label>
          <SpeechInput
            value={assignedTo}
            onChange={onAssignedToChange}
            className="min-h-11"
          />
        </div>
        <div>
          <Label>優先度</Label>
          <Select
            value={priority}
            onValueChange={(v) => v && onPriorityChange(v)}
          >
            <SelectTrigger className="min-h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">高</SelectItem>
              <SelectItem value="medium">中</SelectItem>
              <SelectItem value="low">低</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>プロジェクト</Label>
          <SpeechInput
            value={project}
            onChange={onProjectChange}
            placeholder="例：見積案件"
            className="min-h-11"
          />
        </div>
        <div>
          <Label>コンテキスト</Label>
          <SpeechInput
            value={context}
            onChange={onContextChange}
            placeholder="例：本業"
            className="min-h-11"
          />
        </div>
      </div>

      <div
        className={cn(
          "gap-3",
          compact ? "flex flex-col" : "flex flex-row items-stretch"
        )}
      >
        <Button
          size="lg"
          className={cn(
            "min-h-12 w-full text-base",
            !compact && "min-w-0 flex-[2]"
          )}
          onClick={() => onAction("confirm")}
          disabled={saving}
        >
          保存して次へ
        </Button>
        <div
          className={cn("flex gap-3", compact ? "w-full" : "min-w-0 flex-1")}
        >
          <Button
            variant="outline"
            size="lg"
            className="min-h-11 min-w-0 flex-1"
            onClick={() => onAction("skip")}
            disabled={saving}
          >
            保留
          </Button>
          <Button
            variant="destructive"
            size="lg"
            className="min-h-11 min-w-0 flex-1"
            onClick={() => onAction("delete")}
            disabled={saving}
          >
            削除
          </Button>
        </div>
      </div>
    </>
  );

  const confirmForm = (
    <Card
      className={cn(
        "border-primary/20 shadow-sm",
        compact
          ? "rounded-xl border bg-card py-0 ring-1 ring-foreground/10"
          : "border-0 shadow-none ring-0"
      )}
    >
      <CardContent className={cn("space-y-4", compact ? "p-4" : "p-0 pt-0")}>
        {confirmFields}
      </CardContent>
    </Card>
  );

  const transcriptBlock = (
    <Collapsible open={transcriptOpen} onOpenChange={setTranscriptOpen}>
      <CollapsibleTrigger className="flex w-full items-start justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-capture-surface">
        <div className="min-w-0 flex-1">
          <span className="block">元の入力</span>
          {!transcriptOpen && transcript && (
            <span className="mt-1 block line-clamp-2 text-xs font-normal text-muted-foreground">
              {transcript}
            </span>
          )}
          {(inputType || createdAt) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {inputType && (
                <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                  {inputType === "audio" ? "音声" : "テキスト"}
                </Badge>
              )}
              {createdAt && (
                <span className="text-[10px] text-muted-foreground">
                  {formatRelativeTime(createdAt)}
                </span>
              )}
            </div>
          )}
        </div>
        <ChevronDown
          className={cn(
            "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            transcriptOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl border bg-muted/20 p-4 text-sm leading-relaxed">
          {transcript || "（内容なし）"}
        </p>
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}>
      <div
        className={cn(
          "flex-1 space-y-4 overflow-y-auto",
          compact ? "px-4 pb-4 pt-2" : "p-6 pb-4"
        )}
      >
        {transcriptBlock}
        {structureSection}
        {compact && confirmForm}
      </div>

      {!compact && (
        <div className="shrink-0 border-t bg-card px-6 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
          {confirmForm}
        </div>
      )}
    </div>
  );
}
