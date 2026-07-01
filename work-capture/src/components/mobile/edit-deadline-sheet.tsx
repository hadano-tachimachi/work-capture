"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DeadlinePicker } from "@/components/shared/deadline-picker";
import {
  EditSheetBody,
  EditSheetFooter,
  editSheetContentClassName,
} from "@/components/mobile/edit-sheet-layout";

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
      <EditSheetBody className="pb-4 pt-2">
        <DeadlinePicker value={local} onChange={setLocal} />
      </EditSheetBody>
      <EditSheetFooter
        onSave={() => {
          onSave(local.trim());
          onClose();
        }}
      />
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
      <SheetContent
        side="bottom"
        className={editSheetContentClassName("max-h-[90dvh]")}
      >
        <SheetHeader className="shrink-0 border-b pb-4">
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
