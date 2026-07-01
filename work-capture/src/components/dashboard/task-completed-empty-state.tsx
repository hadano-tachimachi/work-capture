"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type TaskCompletedEmptyStateProps = {
  className?: string;
};

export function TaskCompletedEmptyState({
  className,
}: TaskCompletedEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center",
        className
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <CheckCircle2 className="size-8" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">完了済みのタスクはありません</p>
        <p className="text-sm text-muted-foreground">
          タスクを完了すると、ここから見返せます。
        </p>
      </div>
    </div>
  );
}
