"use client";

import { Progress } from "@/components/ui/progress";

type InboxProgressProps = {
  currentIndex: number;
  totalCount: number;
  remaining: number;
  processedCount?: number;
  className?: string;
};

export function InboxProgress({
  currentIndex,
  totalCount,
  remaining,
  processedCount = 0,
  className,
}: InboxProgressProps) {
  const done = totalCount - remaining;
  const percent = totalCount > 0 ? Math.round((done / totalCount) * 100) : 0;

  return (
    <div className={className}>
      {remaining > 0 ? (
        <>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {currentIndex} / {totalCount} 件目
            </span>
            <span>残り {remaining} 件</span>
          </div>
          <Progress value={percent} className="h-1.5" />
        </>
      ) : processedCount > 0 ? (
        <p className="text-sm text-primary">
          本日 {processedCount} 件を整理しました
        </p>
      ) : null}
    </div>
  );
}
