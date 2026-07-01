"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EditSheetFooterProps = {
  onSave: () => void;
  label?: string;
  disabled?: boolean;
};

export function EditSheetFooter({
  onSave,
  label = "保存して閉じる",
  disabled,
}: EditSheetFooterProps) {
  return (
    <div className="shrink-0 border-t bg-background p-4">
      <Button size="lg" className="w-full" onClick={onSave} disabled={disabled}>
        {label}
      </Button>
    </div>
  );
}

type EditSheetBodyProps = {
  children: ReactNode;
  className?: string;
  scrollable?: boolean;
};

export function EditSheetBody({
  children,
  className,
  scrollable = true,
}: EditSheetBodyProps) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 px-4",
        scrollable && "overflow-y-auto",
        className
      )}
    >
      {children}
    </div>
  );
}

export function editSheetContentClassName(extra?: string) {
  return cn(
    "flex max-h-[85dvh] flex-col gap-0 overflow-hidden rounded-t-2xl p-0",
    extra
  );
}
