"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
          "border-l-4 border-l-primary border-primary/30 bg-capture-surface",
        task.status === "on_hold" && "opacity-80",
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
      </div>
    </button>
  );
}
