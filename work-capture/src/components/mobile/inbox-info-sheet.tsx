"use client";

import { Monitor, Inbox } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

type InboxInfoSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
};

export function InboxInfoSheet({
  open,
  onOpenChange,
  count,
}: InboxInfoSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Inbox className="size-5 text-primary" />
            未整理 {count} 件
          </SheetTitle>
          <SheetDescription>
            PC の Inbox Zero 画面で整理・確定できます
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4 text-sm">
          <div className="flex gap-3 rounded-xl border bg-capture-surface p-4">
            <Monitor className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">PC で開いて整理</p>
              <p className="mt-1 text-muted-foreground">
                スマホでは思考を預けるだけ。担当・優先度・プロジェクトの確定は PC の Inbox Zero で行います。
              </p>
            </div>
          </div>
          <ol className="list-inside list-decimal space-y-2 text-muted-foreground">
            <li>PC ブラウザで Work Capture を開く</li>
            <li>「未整理 inbox」から1件ずつ確認</li>
            <li>「保存して次へ」で仕事として確定</li>
          </ol>
          {count > 0 && (
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
              {count} 件が整理待ちです
            </Badge>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
