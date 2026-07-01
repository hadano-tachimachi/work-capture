"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/capture-helpers";

export type InboxCapture = {
  id: string;
  transcriptText: string | null;
  inputType: string;
  status: string;
  createdAt: string;
  taskCount?: number;
};

type InboxCaptureCardProps = {
  capture: InboxCapture;
  selected?: boolean;
  onClick: () => void;
  className?: string;
};

export function InboxCaptureCard({
  capture,
  selected,
  onClick,
  className,
}: InboxCaptureCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border bg-card p-3 text-left text-sm shadow-sm transition-colors hover:bg-capture-surface",
        selected &&
          "border-l-4 border-l-primary border-primary/30 bg-capture-surface",
        className
      )}
    >
      <p className="line-clamp-2 font-medium">
        {capture.transcriptText?.slice(0, 60) || "（内容なし）"}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(capture.createdAt)}
        </span>
        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
          {capture.inputType === "audio" ? "音声" : "テキスト"}
        </Badge>
        {(capture.taskCount ?? 0) > 0 && (
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            タスク {capture.taskCount}
          </Badge>
        )}
        <Badge
          className={cn(
            "px-1.5 py-0 text-[10px]",
            capture.status === "validation_failed"
              ? "bg-destructive/10 text-destructive hover:bg-destructive/10"
              : "bg-primary/10 text-primary hover:bg-primary/10"
          )}
        >
          {capture.status === "validation_failed" ? "要確認" : "確認待ち"}
        </Badge>
      </div>
    </button>
  );
}
