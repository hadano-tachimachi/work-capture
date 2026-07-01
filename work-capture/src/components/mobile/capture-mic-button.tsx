"use client";

import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

type CaptureMicButtonProps = {
  onClick: () => void;
  variant?: "idle" | "recording";
  disabled?: boolean;
  className?: string;
};

export function CaptureMicButton({
  onClick,
  variant = "idle",
  disabled = false,
  className,
}: CaptureMicButtonProps) {
  const isRecording = variant === "recording";

  return (
    <div className="relative flex items-center justify-center">
      {isRecording && (
        <span
          className="absolute size-[var(--capture-mic-size)] animate-ping rounded-full bg-[var(--capture-recording)]/30"
          aria-hidden
        />
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={isRecording ? "タップして録音終了" : "タップして録音開始"}
        aria-pressed={isRecording}
        className={cn(
          "relative flex items-center justify-center rounded-full shadow-lg transition-all active:scale-95 disabled:opacity-60",
          isRecording
            ? "size-[var(--capture-mic-size)] bg-[var(--capture-recording)] text-white shadow-red-200/50 ring-4 ring-[var(--capture-recording)]/20"
            : "size-[var(--capture-mic-size)] bg-gradient-to-br from-primary to-[oklch(0.42_0.28_300)] text-primary-foreground shadow-lg shadow-primary/35 ring-4 ring-primary/15",
          className
        )}
      >
        <Mic className="size-12" strokeWidth={1.75} />
      </button>
    </div>
  );
}
