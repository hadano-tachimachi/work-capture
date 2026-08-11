"use client";

import Link from "next/link";
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
  /** 旧テキストカラム。Project未紐付け時のフォールバック表示に使う */
  project: string | null;
  projectId?: string | null;
  planTitle?: string | null;
  projectTitle?: string | null;
};

type TaskCardProps = {
  task: TaskSummary;
  selected?: boolean;
  onClick: () => void;
  className?: string;
};

function TaskContextLine({ task }: { task: TaskSummary }) {
  const projectLabel = task.projectTitle?.trim() || task.project?.trim() || null;
  const planLabel = task.planTitle?.trim() || null;

  if (!projectLabel && !planLabel) return null;

  return (
    <p className="mb-1 flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
      {task.projectId && projectLabel ? (
        <Link
          href={`/projects/${task.projectId}`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "truncate underline-offset-2 hover:underline",
            phaseAccentClasses.project.text
          )}
        >
          {projectLabel}
        </Link>
      ) : projectLabel ? (
        <span className="truncate">{projectLabel}</span>
      ) : null}
      {projectLabel && planLabel && (
        <span className="shrink-0 text-muted-foreground/70" aria-hidden>
          ›
        </span>
      )}
      {planLabel && <span className="truncate">{planLabel}</span>}
    </p>
  );
}

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
        "w-full rounded-xl border bg-card p-3 text-left text-sm shadow-sm transition-colors hover:bg-tertiary-muted/35",
        selected && phaseAccentClasses.execute.selected,
        task.status === "on_hold" && "opacity-80",
        task.status === "done" && "opacity-75",
        className
      )}
    >
      <TaskContextLine task={task} />
      <p className="line-clamp-2 font-medium">{task.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
          {priorityLabel(task.priority)}
        </Badge>
        <span className="text-xs text-muted-foreground">
          期限: {formatTaskDueDateShort(task.dueDate)}
        </span>
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
