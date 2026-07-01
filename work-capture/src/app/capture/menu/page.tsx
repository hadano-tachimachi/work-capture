"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { AiProviderSelector } from "@/components/shared/ai-provider-selector";
import { useAiProvider } from "@/lib/hooks/use-ai-provider";
import { cn } from "@/lib/utils";

export default function MenuPage() {
  const { provider, setProvider, providers, selectedInfo } = useAiProvider();

  return (
    <div className="min-h-dvh bg-background p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Work Capture</h1>
        <Link
          href="/capture"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          ×
        </Link>
      </div>
      <nav className="space-y-1">
        {[
          { label: "録音画面", href: "/capture" },
          { label: "未整理 inbox（PC）", href: "/inbox" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-lg px-3 py-3 hover:bg-muted"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {providers.length > 0 && (
        <section className="mt-8 rounded-xl border bg-capture-surface p-4">
          <AiProviderSelector
            provider={provider}
            providers={providers}
            onChange={setProvider}
            showHint
          />
          {selectedInfo && (
            <p className="mt-2 text-xs text-muted-foreground">
              選択中: {selectedInfo.model}
              {!selectedInfo.configured && " — API キー未設定（デモ）"}
            </p>
          )}
        </section>
      )}

      <section className="mt-6 rounded-xl border bg-capture-surface p-4">
        <h2 className="mb-3 text-sm font-semibold">使い方（30秒）</h2>
        <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
          <li>録音画面で思いついたことを話す</li>
          <li>AI の分解結果を確認・編集して登録</li>
          <li>PC の未整理 inbox で担当・優先度を確定</li>
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">
          文字起こしはブラウザ、構造化は選択した AI が担当します。
        </p>
      </section>
    </div>
  );
}
