"use client";

import { useEffect, useState } from "react";
import { Inbox, Menu } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { InboxInfoSheet } from "@/components/mobile/inbox-info-sheet";
import { cn } from "@/lib/utils";

type MobileShellProps = {
  children: React.ReactNode;
  showHeader?: boolean;
  headerRight?: React.ReactNode;
};

export function MobileShell({
  children,
  showHeader = true,
  headerRight,
}: MobileShellProps) {
  const [inboxCount, setInboxCount] = useState(0);
  const [inboxInfoOpen, setInboxInfoOpen] = useState(false);

  useEffect(() => {
    fetch("/api/inbox/count")
      .then((r) => r.json())
      .then((d) => setInboxCount(d.count ?? 0))
      .catch(() => setInboxCount(0));
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {showHeader && (
        <header className="flex items-center justify-between px-4 py-3">
          <Link
            href="/capture/menu"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
            aria-label="メニュー"
          >
            <Menu className="size-5" />
          </Link>
          {headerRight ?? (
            <button
              type="button"
              onClick={() => setInboxInfoOpen(true)}
              className="relative rounded-lg p-2 hover:bg-muted"
              aria-label={`未整理 ${inboxCount} 件。タップして詳細`}
            >
              <Inbox className="size-5 text-muted-foreground" />
              {inboxCount > 0 && (
                <Badge className="absolute -right-0.5 -top-0.5 min-w-5 justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                  {inboxCount}
                </Badge>
              )}
            </button>
          )}
        </header>
      )}
      {children}
      <InboxInfoSheet
        open={inboxInfoOpen}
        onOpenChange={setInboxInfoOpen}
        count={inboxCount}
      />
    </div>
  );
}
