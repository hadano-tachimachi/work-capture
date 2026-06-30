"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PRESETS = ["今日", "明日", "今週中", "来週", "未定"];

type EditDeadlineSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSave: (value: string) => void;
};

function EditDeadlineSheetBody({
  value,
  onSave,
  onClose,
}: {
  value: string;
  onSave: (value: string) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState(value);

  return (
    <>
      <div className="mt-4 space-y-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setLocal(preset)}
            className={cn(
              "w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors",
              local === preset
                ? "border-primary bg-primary/5 text-primary"
                : "hover:bg-muted"
            )}
          >
            {preset}
          </button>
        ))}
        <Input
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder="カスタム期限を入力"
          className="mt-2"
        />
      </div>
      <Button
        className="mt-6 w-full"
        onClick={() => {
          onSave(local.trim());
          onClose();
        }}
      >
        保存して閉じる
      </Button>
    </>
  );
}

export function EditDeadlineSheet({
  open,
  onOpenChange,
  value,
  onSave,
}: EditDeadlineSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>期限を編集</SheetTitle>
        </SheetHeader>
        {open && (
          <EditDeadlineSheetBody
            key={value}
            value={value}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
