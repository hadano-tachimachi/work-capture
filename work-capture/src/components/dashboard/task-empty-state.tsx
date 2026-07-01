"use client";

import Link from "next/link";
import { CheckCircle2, ListTodo } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TaskEmptyStateProps = {
  allDone?: boolean;
  className?: string;
};

export function TaskEmptyState({ allDone, className }: TaskEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center",
        className
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        {allDone ? (
          <CheckCircle2 className="size-8" />
        ) : (
          <ListTodo className="size-8" />
        )}
      </div>
      <div className="space-y-1">
        <p className="font-medium">
          {allDone
            ? "今日のタスクはすべて完了しました"
            : "今日やるタスクはありません"}
        </p>
        <p className="text-sm text-muted-foreground">
          {allDone
            ? "お疲れさまです。新しい Capture があれば Inbox Zero で整理できます。"
            : "PC の Inbox Zero で未整理を処理すると、タスクがここに並びます。"}
        </p>
      </div>
      <Link
        href="/inbox"
        className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
      >
        Inbox Zero へ
      </Link>
    </div>
  );
}
