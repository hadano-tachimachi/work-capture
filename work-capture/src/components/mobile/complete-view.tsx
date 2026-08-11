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
      title="内容を保存しました"
      subtitle="Inbox Zero で確認して、タスクとして確定させましょう"
    >
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link
          href="/inbox"
          className={cn(buttonVariants(), "justify-center")}
        >
          Inbox Zero で確認
        </Link>
        <Link
          href="/capture"
          className={cn(buttonVariants({ variant: "outline" }), "justify-center gap-2")}
        >
          <Plus className="size-4" />
          続けて追加する
        </Link>
      </div>
    </StatusScreen>
  );
}
