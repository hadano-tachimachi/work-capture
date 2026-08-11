"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { phaseAccentClasses } from "@/lib/utils/phase-colors";
import {
  isActiveProjectStatus,
  projectKindLabel,
  projectStatusLabel,
} from "@/lib/utils/project-display";
import { formatTaskDueDateShort } from "@/lib/utils/task-display";

export type ProjectCardData = {
  id: string;
  title: string;
  status: string;
  kind: string | null;
  displayGoal: string | null;
  planCount: number;
  taskTotal: number;
  taskDone: number;
  nextDueDate: string | null;
};

type ProjectCardProps = {
  project: ProjectCardData;
  className?: string;
};

export function ProjectCard({ project, className }: ProjectCardProps) {
  const active = isActiveProjectStatus(project.status);
  const kind = projectKindLabel(project.kind);
  const progress =
    project.taskTotal > 0
      ? Math.round((project.taskDone / project.taskTotal) * 100)
      : 0;

  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-primary/5",
        !active && "opacity-75",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-semibold leading-snug">
            {project.title}
          </p>
          {project.displayGoal && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {project.displayGoal}
            </p>
          )}
        </div>
        <ChevronRight
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge
          className={cn(
            "px-1.5 py-0 text-[10px]",
            active
              ? phaseAccentClasses.project.badgeSoft
              : "bg-muted text-muted-foreground hover:bg-muted"
          )}
        >
          {projectStatusLabel(project.status)}
        </Badge>
        {kind && (
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            {kind}
          </Badge>
        )}
        {project.planCount > 0 && (
          <span className="text-xs text-muted-foreground">
            道筋 {project.planCount}
          </span>
        )}
        {project.nextDueDate && (
          <span className="text-xs text-muted-foreground">
            次の期限: {formatTaskDueDateShort(project.nextDueDate)}
          </span>
        )}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>タスク</span>
          <span className="tabular-nums">
            {project.taskDone} / {project.taskTotal}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-tertiary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
