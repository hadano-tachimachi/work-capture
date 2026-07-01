"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useValidationAlertDismiss } from "@/lib/hooks/use-validation-alert-dismiss";

type ValidationFailedAlertProps = {
  captureId?: string;
  validationStatus: string;
  message?: string;
};

export function ValidationFailedAlert({
  captureId,
  validationStatus,
  message = "AI解析の検証に失敗しました。手動で確認してください。",
}: ValidationFailedAlertProps) {
  const { show, dismiss } = useValidationAlertDismiss(
    captureId,
    validationStatus
  );

  if (!show) return null;

  return (
    <div className="flex items-start gap-2 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm">
      <p className="min-w-0 flex-1 leading-relaxed">{message}</p>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0 text-muted-foreground hover:text-foreground"
        onClick={dismiss}
        aria-label="警告を閉じる"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
