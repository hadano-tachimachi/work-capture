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
import { Input } from "@/components/ui/input";

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

  return (
    <>
      <div className="mt-4 space-y-3 overflow-y-auto pb-24">
        {localTasks.map((task, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-4 shrink-0 text-center text-sm text-muted-foreground">
              {i + 1}
            </span>
            <Input
              value={task}
              onChange={(e) =>
                setLocalTasks((prev) => {
                  const next = [...prev];
                  next[i] = e.target.value;
                  return next;
                })
              }
              placeholder="タスクを入力"
            />
            <Button
              variant="ghost"
              size="icon"
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
          size="sm"
          onClick={() => setLocalTasks((prev) => [...prev, ""])}
        >
          <Plus className="mr-1 size-4" />
          タスクを追加
        </Button>
      </div>
      <div className="absolute inset-x-0 bottom-0 border-t bg-background p-4">
        <Button
          className="w-full"
          onClick={() => {
            onSave(localTasks.map((t) => t.trim()).filter(Boolean));
            onClose();
          }}
        >
          保存して閉じる
        </Button>
      </div>
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
      <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-2xl">
        <SheetHeader>
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
