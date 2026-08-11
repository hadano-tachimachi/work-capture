"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SpeechInput } from "@/components/shared/speech-input";
import {
  EditSheetBody,
  EditSheetFooter,
  editSheetContentClassName,
} from "@/components/mobile/edit-sheet-layout";

type EditStepsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: string[];
  onSave: (steps: string[]) => void;
};

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function EditStepsSheetBody({
  steps,
  onSave,
  onClose,
}: {
  steps: string[];
  onSave: (steps: string[]) => void;
  onClose: () => void;
}) {
  const [localSteps, setLocalSteps] = useState(steps.length > 0 ? steps : [""]);

  function handleSave() {
    onSave(localSteps.map((s) => s.trim()).filter(Boolean));
    onClose();
  }

  return (
    <>
      <EditSheetBody className="space-y-3 pb-4 pt-2">
        <p className="text-xs text-muted-foreground">
          この順番で進めると辿り着ける、というPlanの道筋です。タスクより粗い粒度でかまいません。
        </p>
        {localSteps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-center text-sm text-muted-foreground">
              {i + 1}
            </span>
            <SpeechInput
              value={step}
              onChange={(value) =>
                setLocalSteps((prev) => {
                  const next = [...prev];
                  next[i] = value;
                  return next;
                })
              }
              placeholder="道筋のステップを入力"
              className="flex-1"
            />
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                disabled={i === 0}
                onClick={() =>
                  setLocalSteps((prev) => moveItem(prev, i, i - 1))
                }
                aria-label="上に移動"
              >
                <ChevronUp className="size-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={i === localSteps.length - 1}
                onClick={() =>
                  setLocalSteps((prev) => moveItem(prev, i, i + 1))
                }
                aria-label="下に移動"
              >
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setLocalSteps((prev) => prev.filter((_, idx) => idx !== i))
                }
                aria-label="削除"
              >
                <Trash2 className="size-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        ))}
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => setLocalSteps((prev) => [...prev, ""])}
        >
          <Plus className="mr-2 size-4" />
          ステップを追加
        </Button>
      </EditSheetBody>
      <EditSheetFooter onSave={handleSave} />
    </>
  );
}

export function EditStepsSheet({
  open,
  onOpenChange,
  steps,
  onSave,
}: EditStepsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={editSheetContentClassName()}>
        <SheetHeader className="shrink-0 border-b pb-4">
          <SheetTitle>道筋（Plan Steps）を編集</SheetTitle>
        </SheetHeader>
        {open && (
          <EditStepsSheetBody
            key={steps.join("|")}
            steps={steps}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
