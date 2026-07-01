"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SpeechInput } from "@/components/shared/speech-input";
import {
  EditSheetBody,
  EditSheetFooter,
  editSheetContentClassName,
} from "@/components/mobile/edit-sheet-layout";

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
      <EditSheetBody className="space-y-4 pb-4 pt-2">
        <RadioGroup value={local} onValueChange={setLocal} className="space-y-2">
          {options.map((option) => (
            <div
              key={option}
              className="flex min-h-11 items-center gap-3 rounded-lg border px-4 py-3"
            >
              <RadioGroupItem value={option} id={option} />
              <Label htmlFor={option} className="flex-1 cursor-pointer">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <div>
          <Label className="mb-2 block text-sm text-muted-foreground">
            または入力
          </Label>
          <SpeechInput
            value={custom}
            onChange={(value) => {
              setCustom(value);
              setLocal(value);
            }}
            placeholder="次の一歩を入力"
          />
        </div>
      </EditSheetBody>
      <EditSheetFooter
        onSave={() => {
          onSave((custom || local).trim());
          onClose();
        }}
      />
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
      <SheetContent side="bottom" className={editSheetContentClassName()}>
        <SheetHeader className="shrink-0 border-b pb-4">
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
