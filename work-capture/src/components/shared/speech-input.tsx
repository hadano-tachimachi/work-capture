"use client";

import { Mic, MicOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSpeechDictation } from "@/lib/hooks/use-speech-dictation";
import { cn } from "@/lib/utils";

type SpeechInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange"
> & {
  value: string;
  onChange: (value: string) => void;
};

export function SpeechInput({
  value,
  onChange,
  className,
  ...props
}: SpeechInputProps) {
  const { listening, supported, toggle } = useSpeechDictation();

  return (
    <div className="relative flex min-w-0 flex-1 items-center">
      <Input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(supported && "pr-12", className)}
      />
      {supported && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(
            "absolute right-1 shrink-0",
            listening && "text-primary"
          )}
          onClick={() => toggle(value, onChange)}
          aria-label={listening ? "音声入力を停止" : "音声入力"}
          aria-pressed={listening}
        >
          {listening ? (
            <MicOff className="size-4" />
          ) : (
            <Mic className="size-4" />
          )}
        </Button>
      )}
    </div>
  );
}

type SpeechTextareaProps = Omit<
  React.ComponentProps<typeof Textarea>,
  "value" | "onChange"
> & {
  value: string;
  onChange: (value: string) => void;
};

export function SpeechTextarea({
  value,
  onChange,
  className,
  ...props
}: SpeechTextareaProps) {
  const { listening, supported, toggle } = useSpeechDictation();

  return (
    <div className="relative">
      <Textarea
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(supported && "pb-12", className)}
      />
      {supported && (
        <Button
          type="button"
          variant={listening ? "default" : "outline"}
          size="sm"
          className="absolute bottom-3 right-3 gap-1.5"
          onClick={() => toggle(value, onChange)}
          aria-label={listening ? "音声入力を停止" : "音声入力"}
          aria-pressed={listening}
        >
          {listening ? (
            <MicOff className="size-4" />
          ) : (
            <Mic className="size-4" />
          )}
          {listening ? "停止" : "音声入力"}
        </Button>
      )}
    </div>
  );
}
