"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, ListTodo, Mic, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { AiProviderSelector } from "@/components/shared/ai-provider-selector";
import { useAiProvider } from "@/lib/hooks/use-ai-provider";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: typeof Mic;
  description: string;
  badge?: number;
};

export default function MenuPage() {
  const { provider, setProvider, providers, selectedInfo } = useAiProvider();
  const [inboxCount, setInboxCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    fetch("/api/inbox/count")
      .then((r) => r.json())
      .then((d) => setInboxCount(d.count ?? 0))
      .catch(() => setInboxCount(0));

    fetch("/api/tasks/count")
      .then((r) => r.json())
      .then((d) => setTaskCount(d.active ?? 0))
      .catch(() => setTaskCount(0));
  }, []);

  const navItems: NavItem[] = [
    {
      label: "録音画面",
      href: "/capture",
      icon: Mic,
      description: "思考を話す・テキスト入力",
    },
    {
      label: "今日やること",
      href: "/capture/tasks",
      icon: ListTodo,
      description: "確定済みタスクを完了",
      badge: taskCount,
    },
    {
      label: "未整理 Inbox",
      href: "/inbox",
      icon: Monitor,
      description: "担当・優先度を確定",
      badge: inboxCount,
    },
  ];

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
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm transition-colors hover:bg-capture-surface active:bg-muted"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge className="min-w-5 justify-center bg-primary px-1.5 text-[10px] text-primary-foreground hover:bg-primary">
                      {item.badge}
                    </Badge>
                  )}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {item.description}
                </span>
              </span>
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
            </Link>
          );
        })}
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
          <li>Inbox Zero で担当・優先度を確定</li>
          <li>Dashboard でタスクを完了する</li>
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">
          文字起こしはブラウザ、構造化は選択した AI が担当します。
        </p>
      </section>
    </div>
  );
}
