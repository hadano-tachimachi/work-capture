"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ProcessingView } from "@/components/mobile/processing-view";

function ProcessingContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  return <ProcessingView captureId={id} />;
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">読み込み中…</div>}>
      <ProcessingContent />
    </Suspense>
  );
}
