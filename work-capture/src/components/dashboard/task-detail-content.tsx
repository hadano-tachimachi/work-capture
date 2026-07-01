"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { formatDueDateDisplay } from "@/lib/utils/date-helpers";
import { priorityLabel } from "@/lib/utils/task-display";

type TaskDetailContentProps = {
  title: string;
  description: string | null;
  priority: string | null;
  dueDate: string | null;
  project: string | null;
  context: string | null;
  assignedTo: string | null;
  nextAction: string | null;
  notes: string[];
  status: string;
  saving?: boolean;
  compact?: boolean;
  onComplete: () => void;
  onHold: () => void;
  className?: string;
};

export function TaskDetailContent({
  title,
  description,
  priority,
  dueDate,
  project,
  context,
  assignedTo,
  nextAction,
  notes,
  status,
  saving,
  compact,
  onComplete,
  onHold,
  className,
}: TaskDetailContentProps) {
  const [notesOpen, setNotesOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden",
        className
      )}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        <h2 className="text-xl font-semibold leading-snug">{title}</h2>

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline">{priorityLabel(priority)}</Badge>
          <Badge variant="outline">
            期限: {dueDate ? formatDueDateDisplay(dueDate) : "なし"}
          </Badge>
          {project && <Badge variant="outline">{project}</Badge>}
          {context && <Badge variant="outline">{context}</Badge>}
          {assignedTo && <Badge variant="outline">担当: {assignedTo}</Badge>}
          {status === "on_hold" && (
            <Badge className="bg-muted text-muted-foreground hover:bg-muted">
              保留中
            </Badge>
          )}
        </div>

        {description && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              説明
            </p>
            <p className="text-sm leading-relaxed">{description}</p>
          </div>
        )}

        {nextAction && (
          <div className="mt-6 rounded-xl border bg-capture-surface p-4">
            <p className="mb-1 text-sm font-medium text-muted-foreground">
              次の一歩
            </p>
            <p className="text-sm leading-relaxed">{nextAction}</p>
          </div>
        )}

        {notes.length > 0 && (
          <Collapsible
            open={notesOpen}
            onOpenChange={setNotesOpen}
            className="mt-4"
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border bg-capture-surface px-4 py-3 text-sm font-medium">
              メモ（{notes.length}）
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-200",
                  notesOpen && "rotate-180"
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2 rounded-xl border bg-card p-4 text-sm leading-relaxed">
              {notes.map((note, i) => (
                <p key={i}>{note}</p>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {compact && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            詳細の編集は PC の Dashboard で行えます
          </p>
        )}
      </div>

      <div
        className={cn(
          "shrink-0 border-t bg-background p-4",
          compact && "pb-[max(1rem,env(safe-area-inset-bottom))]"
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            className="min-w-0 flex-1"
            onClick={onComplete}
            disabled={saving}
          >
            完了
          </Button>
          {status !== "on_hold" ? (
            <Button
              variant="outline"
              size="lg"
              className="min-w-0 flex-1"
              onClick={onHold}
              disabled={saving}
            >
              保留
            </Button>
          ) : (
            <Button
              variant="outline"
              size="lg"
              className="min-w-0 flex-1"
              onClick={onHold}
              disabled={saving}
            >
              やることに戻す
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
