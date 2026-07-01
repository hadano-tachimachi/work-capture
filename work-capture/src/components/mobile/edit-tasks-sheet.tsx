"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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

type EditTasksSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: string[];
  onSave: (tasks: string[]) => void;
};

function EditTasksSheetBody({
  tasks,
  onSave,
  onClose,
}: {
  tasks: string[];
  onSave: (tasks: string[]) => void;
  onClose: () => void;
}) {
  const [localTasks, setLocalTasks] = useState(
    tasks.length > 0 ? tasks : [""]
  );

  function handleSave() {
    onSave(localTasks.map((t) => t.trim()).filter(Boolean));
    onClose();
  }

  return (
    <>
      <EditSheetBody className="space-y-3 pb-4 pt-2">
        {localTasks.map((task, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-center text-sm text-muted-foreground">
              {i + 1}
            </span>
            <SpeechInput
              value={task}
              onChange={(value) =>
                setLocalTasks((prev) => {
                  const next = [...prev];
                  next[i] = value;
                  return next;
                })
              }
              placeholder="タスクを入力"
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() =>
                setLocalTasks((prev) => prev.filter((_, idx) => idx !== i))
              }
              aria-label="削除"
            >
              <Trash2 className="size-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => setLocalTasks((prev) => [...prev, ""])}
        >
          <Plus className="mr-2 size-4" />
          タスクを追加
        </Button>
      </EditSheetBody>
      <EditSheetFooter onSave={handleSave} />
    </>
  );
}

export function EditTasksSheet({
  open,
  onOpenChange,
  tasks,
  onSave,
}: EditTasksSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={editSheetContentClassName()}>
        <SheetHeader className="shrink-0 border-b pb-4">
          <SheetTitle>タスクを編集</SheetTitle>
        </SheetHeader>
        {open && (
          <EditTasksSheetBody
            key={tasks.join("|")}
            tasks={tasks}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
