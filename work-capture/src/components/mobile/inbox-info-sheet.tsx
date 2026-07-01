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
import { editSheetContentClassName } from "@/components/mobile/edit-sheet-layout";

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
      <SheetContent
        side="bottom"
        className={editSheetContentClassName("pb-[max(1.5rem,env(safe-area-inset-bottom))]")}
      >
        <SheetHeader className="shrink-0 border-b pb-4">
          <SheetTitle className="flex items-center gap-2 pr-8">
            <Inbox className="size-5 text-primary" />
            未整理 {count} 件
          </SheetTitle>
          <SheetDescription className="text-left">
            PC の Inbox Zero 画面で整理・確定できます
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pt-4 text-sm leading-relaxed">
          <div className="flex gap-3 rounded-xl border bg-capture-surface p-4">
            <Monitor className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="font-medium">PC で開いて整理</p>
              <p className="mt-1.5 text-muted-foreground">
                スマホでは思考を預けるだけ。担当・優先度・プロジェクトの確定は
                PC の Inbox Zero で行います。
              </p>
            </div>
          </div>

          <ol className="list-decimal space-y-2.5 pl-5 text-muted-foreground">
            <li className="pl-1">PC ブラウザで Work Capture を開く</li>
            <li className="pl-1">「未整理 inbox」から1件ずつ確認</li>
            <li className="pl-1">「保存して次へ」で仕事として確定</li>
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
