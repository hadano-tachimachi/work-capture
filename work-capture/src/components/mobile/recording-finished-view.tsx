"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Bot, CheckCircle2, Loader2 } from "lucide-react";
import { StatusScreen } from "@/components/mobile/status-screen";
import { Button } from "@/components/ui/button";
import type { AiProvider } from "@/lib/ai/types";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

type RecordingFinishedViewProps = {
  durationSec: number;
  blob: Blob;
  mimeType: string;
  transcript: string;
  provider: AiProvider;
  onError: () => void;
};

export function RecordingFinishedView({
  durationSec,
  blob,
  mimeType,
  transcript,
  provider,
  onError,
}: RecordingFinishedViewProps) {
  const router = useRouter();
  const uploadedRef = useRef(false);
  const [phase, setPhase] = useState<"uploading" | "error">("uploading");
  const [errorMessage, setErrorMessage] = useState("");

  async function upload() {
    const formData = new FormData();
    if (transcript.trim()) {
      formData.append("transcript", transcript.trim());
    }
    formData.append("audio", blob, "recording.webm");
    formData.append("mimeType", mimeType);
    formData.append("provider", provider);

    const res = await fetch("/api/capture", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.code === "PROVIDER_NOT_CONFIGURED") {
        throw new Error(
          `${data.error}。メニューから利用可能な AI を選択してください。`
        );
      }
      throw new Error(data.error || "アップロードに失敗しました");
    }
    router.replace(`/capture/review/${data.id}`);
  }

  useEffect(() => {
    if (uploadedRef.current) return;
    uploadedRef.current = true;

    upload().catch((e) => {
      setErrorMessage(
        e instanceof Error ? e.message : "アップロードに失敗しました"
      );
      setPhase("error");
    });
  }, [blob, mimeType, transcript, provider, router]);

  if (phase === "error") {
    return (
      <StatusScreen
        icon={
          <AlertCircle className="size-10 text-destructive" strokeWidth={1.75} />
        }
        title="送信に失敗しました"
        subtitle={errorMessage}
      >
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Button
            size="lg"
            onClick={() => {
              setPhase("uploading");
              setErrorMessage("");
              upload().catch((e) => {
                setErrorMessage(
                  e instanceof Error ? e.message : "再送信に失敗しました"
                );
                setPhase("error");
              });
            }}
          >
            再送信
          </Button>
          <Button variant="outline" size="lg" onClick={onError}>
            録音画面に戻る
          </Button>
        </div>
      </StatusScreen>
    );
  }

  return (
    <StatusScreen
      icon={
        <div className="relative">
          <CheckCircle2 className="size-10" strokeWidth={1.75} />
          <Loader2 className="absolute -bottom-1 -right-1 size-5 animate-spin text-primary" />
        </div>
      }
      title="録音を終了しました"
      subtitle="内容をAIが整理しています"
    >
      <p className="text-sm text-muted-foreground">
        録音時間：{formatDuration(durationSec)}
      </p>
      <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Bot className="size-4 animate-pulse text-primary" />
        <span>構造化を実行中…</span>
      </div>
    </StatusScreen>
  );
}
