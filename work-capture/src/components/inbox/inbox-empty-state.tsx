"use client";

import Link from "next/link";
import { Inbox, Mic } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InboxEmptyStateProps = {
  processedCount?: number;
  className?: string;
};

export function InboxEmptyState({
  processedCount = 0,
  className,
}: InboxEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-4 px-6",
        className
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Inbox className="size-8" />
      </div>
      <p className="text-muted-foreground">
        未整理の Work Capture はありません
      </p>
      {processedCount > 0 && (
        <p className="text-sm text-primary">
          本日 {processedCount} 件を整理しました
        </p>
      )}
      <Link
        href="/capture"
        className={cn(buttonVariants(), "gap-2 justify-center")}
      >
        <Mic className="size-4" />
        思考を預ける
      </Link>
    </div>
  );
}
