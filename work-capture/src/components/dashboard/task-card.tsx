"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { phaseAccentClasses } from "@/lib/utils/phase-colors";
import {
  formatTaskDueDateShort,
  priorityLabel,
} from "@/lib/utils/task-display";

export type TaskSummary = {
  id: string;
  title: string;
  dueDate: string | null;
  priority: string | null;
  status: string;
  project: string | null;
};

type TaskCardProps = {
  task: TaskSummary;
  selected?: boolean;
  onClick: () => void;
  className?: string;
};

export function TaskCard({
  task,
  selected,
  onClick,
  className,
}: TaskCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border bg-card p-3 text-left text-sm shadow-sm transition-colors hover:bg-capture-surface",
        selected &&
          cn(
            "border-l-4 bg-capture-surface",
            phaseAccentClasses.execute.border
          ),
        task.status === "on_hold" && "opacity-80",
        task.status === "done" && "opacity-75",
        className
      )}
    >
      <p className="line-clamp-2 font-medium">{task.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
          {priorityLabel(task.priority)}
        </Badge>
        <span className="text-xs text-muted-foreground">
          期限: {formatTaskDueDateShort(task.dueDate)}
        </span>
        {task.project && (
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            {task.project}
          </Badge>
        )}
        {task.status === "on_hold" && (
          <Badge className="bg-muted px-1.5 py-0 text-[10px] text-muted-foreground hover:bg-muted">
            保留
          </Badge>
        )}
        {task.status === "done" && (
          <Badge
            className={cn(
              "px-1.5 py-0 text-[10px]",
              phaseAccentClasses.execute.badgeSoft
            )}
          >
            完了
          </Badge>
        )}
      </div>
    </button>
  );
}
