"use client";

import { use } from "react";
import { ReviewView } from "@/components/mobile/review-view";

export default function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ReviewView captureId={id} />;
}
