"use client";

import { useState } from "react";
import { Keyboard, X } from "lucide-react";
import { MobileShell } from "@/components/mobile/mobile-shell";
import { CaptureMicButton } from "@/components/mobile/capture-mic-button";
import { RecordingFinishedView } from "@/components/mobile/recording-finished-view";
import { TextInputSheet } from "@/components/mobile/text-input-sheet";
import { AudioWaveform } from "@/components/mobile/audio-waveform";
import { useAudioCapture } from "@/components/mobile/use-audio-capture";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MIN_RECORDING_SECONDS } from "@/lib/utils/capture-helpers";
import {
  hapticCaptureStart,
  hapticCaptureStop,
  hapticError,
} from "@/lib/utils/haptic";

type Phase = "capture" | "finished";

export function CaptureHome() {
  const [phase, setPhase] = useState<Phase>("capture");
  const [textOpen, setTextOpen] = useState(false);
  const [finishedData, setFinishedData] = useState<{
    blob: Blob;
    mimeType: string;
    durationSec: number;
  } | null>(null);

  const [shortRecordingHint, setShortRecordingHint] = useState(false);

  const {
    isRecording,
    isStopping,
    stream,
    liveTranscript,
    formattedDuration,
    speechSupported,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioCapture();

  async function handleMicTap() {
    if (isStopping) return;
    setShortRecordingHint(false);

    if (!isRecording) {
      hapticCaptureStart();
      await startRecording();
      return;
    }

    const result = await stopRecording();
    if (!result) return;

    if ("tooShort" in result) {
      hapticError();
      setShortRecordingHint(true);
      return;
    }

    hapticCaptureStop();
    setFinishedData(result);
    setPhase("finished");
  }

  if (phase === "finished" && finishedData) {
    return (
      <RecordingFinishedView
        durationSec={finishedData.durationSec}
        blob={finishedData.blob}
        mimeType={finishedData.mimeType}
        onError={() => {
          setFinishedData(null);
          setPhase("capture");
        }}
      />
    );
  }

  return (
    <MobileShell
      headerRight={
        isRecording ? (
          <Badge variant="destructive" className="gap-1.5">
            <span className="size-2 animate-pulse rounded-full bg-white" />
            録音中
          </Badge>
        ) : undefined
      }
    >
      <main className="flex flex-1 flex-col items-center px-6 pb-4 pt-4">
        <CaptureMicButton
          variant={isRecording ? "recording" : "idle"}
          onClick={handleMicTap}
          disabled={isStopping}
          className="mb-8"
        />

        <p className="mb-2 text-lg font-semibold">
          {isRecording ? "タップして録音終了" : "タップして録音開始"}
        </p>

        {isRecording ? (
          <>
            <p className="mb-2 font-mono text-sm tabular-nums text-muted-foreground">
              {formattedDuration}
            </p>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              話してください
            </p>
            <AudioWaveform stream={stream} className="mb-6" />
            <div className="w-full min-h-32 flex-1 overflow-y-auto rounded-xl bg-capture-surface p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {liveTranscript ||
                  (speechSupported
                    ? "認識中…"
                    : "この端末ではリアルタイム表示できません。録音後に文字起こしします。")}
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="mb-1 text-center text-muted-foreground">
              思いついたことを話してください
            </p>
            <p className="text-center text-sm text-muted-foreground">
              AIが仕事として整理します
            </p>
          </>
        )}

        {error && (
          <p className="mt-4 text-center text-sm text-destructive">{error}</p>
        )}

        {shortRecordingHint && (
          <p className="mt-4 text-center text-sm text-destructive">
            録音時間が短すぎます（{MIN_RECORDING_SECONDS}秒以上話してください）
          </p>
        )}

        {isRecording && (
          <button
            type="button"
            onClick={cancelRecording}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "mt-4 gap-1 text-muted-foreground"
            )}
          >
            <X className="size-4" />
            キャンセル
          </button>
        )}
      </main>

      {!isRecording && (
        <footer className="border-t px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setTextOpen(true)}
          >
            <Keyboard className="size-4" />
            テキスト入力（声が出せない時）
          </Button>
        </footer>
      )}

      <TextInputSheet open={textOpen} onOpenChange={setTextOpen} />
    </MobileShell>
  );
}
