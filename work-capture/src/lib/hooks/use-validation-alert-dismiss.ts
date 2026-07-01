"use client";

import { useCallback, useEffect, useState } from "react";

function storageKey(captureId: string) {
  return `wc-validation-dismissed-${captureId}`;
}

export function useValidationAlertDismiss(
  captureId: string | undefined,
  validationStatus: string
) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!captureId || validationStatus !== "failed") {
      setDismissed(true);
      return;
    }
    setDismissed(localStorage.getItem(storageKey(captureId)) === "1");
  }, [captureId, validationStatus]);

  const dismiss = useCallback(() => {
    if (captureId) {
      localStorage.setItem(storageKey(captureId), "1");
    }
    setDismissed(true);
  }, [captureId]);

  const show = validationStatus === "failed" && !!captureId && !dismissed;

  return { show, dismiss };
}
