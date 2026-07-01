"use client";

import Link from "next/link";
import { CheckCircle2, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { StatusScreen } from "@/components/mobile/status-screen";
import { cn } from "@/lib/utils";

export function CompleteView() {
  return (
    <StatusScreen
      icon={<CheckCircle2 className="size-10" strokeWidth={1.75} />}
      title="登録しました"
      subtitle="Inbox Zero で確認・整理できます"
    >
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link
          href="/capture"
          className={cn(buttonVariants(), "justify-center gap-2")}
        >
          <Plus className="size-4" />
          続けて追加する
        </Link>
        <Link
          href="/inbox"
          className={cn(buttonVariants({ variant: "outline" }), "justify-center")}
        >
          Inbox Zero で確認
        </Link>
      </div>
    </StatusScreen>
  );
}
