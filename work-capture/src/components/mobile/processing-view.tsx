"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusScreen } from "@/components/mobile/status-screen";

const STEPS = [
  { key: "transcribe", label: "文字起こし中" },
  { key: "understand", label: "内容を理解中" },
  { key: "tasks", label: "タスクを抽出中" },
  { key: "deadline", label: "期限を認識中" },
  { key: "actions", label: "アクションを整理中" },
] as const;

function stepIndexFromCapture(data: {
  capture?: { status?: string; transcriptText?: string | null };
  items?: unknown[];
  parseResult?: unknown;
}): number {
  if (!data.capture) return -1;

  const status = data.capture.status;
  if (status === "ready_for_review" || status === "validation_failed") {
    return STEPS.length;
  }
  if (data.parseResult) return 4;
  if (data.items && data.items.length > 0) return 3;
  if (data.capture.transcriptText) return 1;
  return 0;
}

type ProcessingViewProps = {
  captureId: string;
};

export function ProcessingView({ captureId }: ProcessingViewProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!captureId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/captures?id=${captureId}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        const idx = stepIndexFromCapture(data);
        if (idx < 0) return;

        setStepIndex(Math.min(idx, STEPS.length - 1));

        if (idx >= STEPS.length) {
          setDone(true);
          setTimeout(() => {
            router.replace(`/capture/review/${captureId}`);
          }, 600);
        }
      } catch {
        // keep polling
      }
    };

    const interval = setInterval(poll, 800);
    void poll();
    return () => clearInterval(interval);
  }, [captureId, router]);

  const progress = done ? 100 : ((stepIndex + 1) / STEPS.length) * 100;

  if (notFound) {
    return (
      <StatusScreen
        icon={<Bot className="size-10" strokeWidth={1.75} />}
        title="データが見つかりません"
        subtitle="録音画面からやり直してください"
      >
        <Button onClick={() => router.push("/capture")}>録音画面へ</Button>
      </StatusScreen>
    );
  }

  return (
    <StatusScreen
      icon={<Bot className="size-10" strokeWidth={1.75} />}
      title="AIが解析しています"
      subtitle="数秒〜十数秒かかることがあります"
    >
      <div className="mb-6 w-full max-w-sm space-y-3">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center gap-3 text-sm">
            {i < stepIndex || done ? (
              <Check className="size-4 text-primary" />
            ) : i === stepIndex ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <span className="size-4 rounded-full border border-muted-foreground/30" />
            )}
            <span
              className={
                i <= stepIndex || done
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <Progress value={progress} className="mb-8 w-full max-w-sm" />

      <Button variant="ghost" onClick={() => router.push("/capture")}>
        録音画面に戻る
      </Button>
    </StatusScreen>
  );
}
