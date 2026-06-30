"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type EditMemoSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memos: string[];
  onSave: (memos: string[]) => void;
};

function EditMemoSheetBody({
  memos,
  onSave,
  onClose,
}: {
  memos: string[];
  onSave: (memos: string[]) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState(memos.join("\n"));

  return (
    <>
      <Textarea
        className="mt-4 min-h-40"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="メモを入力"
      />
      <Button
        className="mt-4 w-full"
        onClick={() => {
          onSave(
            local
              .split("\n")
              .map((m) => m.trim())
              .filter(Boolean)
          );
          onClose();
        }}
      >
        保存して閉じる
      </Button>
    </>
  );
}

export function EditMemoSheet({
  open,
  onOpenChange,
  memos,
  onSave,
}: EditMemoSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>メモを編集</SheetTitle>
        </SheetHeader>
        {open && (
          <EditMemoSheetBody
            key={memos.join("|")}
            memos={memos}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
