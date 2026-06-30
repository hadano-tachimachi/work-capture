"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";

type EditNextStepSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  taskOptions: string[];
  onSave: (value: string) => void;
};

function EditNextStepSheetBody({
  value,
  taskOptions,
  onSave,
  onClose,
}: {
  value: string;
  taskOptions: string[];
  onSave: (value: string) => void;
  onClose: () => void;
}) {
  const options = [
    ...new Set([...taskOptions.filter(Boolean), value].filter(Boolean)),
  ];
  const [local, setLocal] = useState(value);
  const [custom, setCustom] = useState(
    taskOptions.includes(value) ? "" : value
  );

  return (
    <>
      <RadioGroup
        value={local}
        onValueChange={setLocal}
        className="mt-4 space-y-2"
      >
        {options.map((option) => (
          <div
            key={option}
            className="flex items-center gap-3 rounded-lg border px-4 py-3"
          >
            <RadioGroupItem value={option} id={option} />
            <Label htmlFor={option} className="flex-1 cursor-pointer">
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
      <div className="mt-4">
        <Label className="mb-2 block text-sm text-muted-foreground">
          または入力
        </Label>
        <Input
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value);
            setLocal(e.target.value);
          }}
          placeholder="次の一歩を入力"
        />
      </div>
      <Button
        className="mt-6 w-full"
        onClick={() => {
          onSave((custom || local).trim());
          onClose();
        }}
      >
        保存して閉じる
      </Button>
    </>
  );
}

export function EditNextStepSheet({
  open,
  onOpenChange,
  value,
  taskOptions,
  onSave,
}: EditNextStepSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>次の一歩を選択</SheetTitle>
        </SheetHeader>
        {open && (
          <EditNextStepSheetBody
            key={`${value}-${taskOptions.join("|")}`}
            value={value}
            taskOptions={taskOptions}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
