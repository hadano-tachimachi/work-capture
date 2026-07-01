"use client";

import { cn } from "@/lib/utils";
import { phaseAccentClasses } from "@/lib/utils/phase-colors";
import type { TaskView } from "@/lib/hooks/use-task-workspace";

type TaskViewTabsProps = {
  view: TaskView;
  onViewChange: (view: TaskView) => void;
  activeCount: number;
  doneCount: number;
  className?: string;
};

export function TaskViewTabs({
  view,
  onViewChange,
  activeCount,
  doneCount,
  className,
}: TaskViewTabsProps) {
  return (
    <div
      className={cn(
        "flex gap-1 rounded-xl bg-tertiary-muted/70 p-1 ring-1 ring-tertiary/20",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onViewChange("active")}
        className={cn(
          "min-w-0 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          view === "active"
            ? phaseAccentClasses.execute.navActive
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        やること
        {activeCount > 0 && (
          <span className="ml-1 text-xs text-muted-foreground">
            ({activeCount})
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => onViewChange("completed")}
        className={cn(
          "min-w-0 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          view === "completed"
            ? phaseAccentClasses.execute.navActive
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        完了済み
        {doneCount > 0 && (
          <span className="ml-1 text-xs text-muted-foreground">
            ({doneCount})
          </span>
        )}
      </button>
    </div>
  );
}
