"use client";

import Link from "next/link";
import { Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PcWorkHeaderProps = {
  mode: "inbox" | "dashboard";
  inboxCount?: number;
  taskCount?: number;
  trailing?: React.ReactNode;
};

export function PcWorkHeader({
  mode,
  inboxCount = 0,
  taskCount = 0,
  trailing,
}: PcWorkHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b bg-card px-6 py-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <h1 className="shrink-0 text-xl font-semibold text-primary">
          Work Capture
        </h1>
        <nav className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
          <Link
            href="/inbox"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              mode === "inbox"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Inbox Zero
            {inboxCount > 0 && (
              <Badge className="ml-1.5 min-w-5 justify-center bg-primary px-1 text-[10px] text-primary-foreground hover:bg-primary">
                {inboxCount}
              </Badge>
            )}
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              mode === "dashboard"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Dashboard
            {taskCount > 0 && (
              <Badge className="ml-1.5 min-w-5 justify-center bg-primary px-1 text-[10px] text-primary-foreground hover:bg-primary">
                {taskCount}
              </Badge>
            )}
          </Link>
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        {trailing}
        <Link
          href="/capture"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1"
          )}
        >
          <Mic className="size-4" />
          音声で追加
        </Link>
      </div>
    </header>
  );
}
