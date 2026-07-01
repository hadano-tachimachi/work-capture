"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import type { AiProvider } from "@/lib/ai/types";

type TextInputSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: AiProvider;
};

export function TextInputSheet({
  open,
  onOpenChange,
  provider,
}: TextInputSheetProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!text.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, provider }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "送信に失敗しました";
        if (data.code === "PROVIDER_NOT_CONFIGURED") {
          throw new Error(`${msg}。メニューから利用可能な AI を選択してください。`);
        }
        if (msg.includes("DATABASE_URL")) {
          throw new Error(
            "DB未設定です。開発時は npm run dev で自動的にローカルDBを使います。サーバーを再起動してください。"
          );
        }
        throw new Error(msg);
      }
      onOpenChange(false);
      setText("");
      router.push(`/capture/review/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "送信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70dvh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>テキストで追加</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex flex-1 flex-col gap-4">
          <Textarea
            placeholder="思いついたことを入力…"
            className="min-h-40 flex-1 resize-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSubmit} disabled={loading || !text.trim()}>
            {loading ? "AIで整理中…" : "AIで整理する"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
