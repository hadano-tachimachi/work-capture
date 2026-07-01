"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SpeechTextarea } from "@/components/shared/speech-input";
import {
  EditSheetBody,
  EditSheetFooter,
  editSheetContentClassName,
} from "@/components/mobile/edit-sheet-layout";

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
      <EditSheetBody className="pb-4 pt-2">
        <SpeechTextarea
          className="min-h-40"
          value={local}
          onChange={setLocal}
          placeholder="メモを入力"
        />
      </EditSheetBody>
      <EditSheetFooter
        onSave={() => {
          onSave(
            local
              .split("\n")
              .map((m) => m.trim())
              .filter(Boolean)
          );
          onClose();
        }}
      />
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
      <SheetContent side="bottom" className={editSheetContentClassName()}>
        <SheetHeader className="shrink-0 border-b pb-4">
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
