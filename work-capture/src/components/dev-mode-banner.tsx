"use client";

import { useEffect, useState } from "react";

type HealthInfo = {
  dbMode: string;
  devFallback: boolean;
  aiMock: boolean;
  message: string;
};

export function DevModeBanner() {
  const [info, setInfo] = useState<HealthInfo | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => null);
  }, []);

  if (!info?.devFallback) return null;

  return (
    <div className="border-b bg-primary/5 px-4 py-2 text-center text-xs text-primary">
      開発モード — {info.message}
    </div>
  );
}
