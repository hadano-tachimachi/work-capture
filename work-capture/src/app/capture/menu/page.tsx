"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Inbox,
  ListTodo,
  Mic,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { AiProviderSelector } from "@/components/shared/ai-provider-selector";
import { useAiProvider } from "@/lib/hooks/use-ai-provider";
import { cn } from "@/lib/utils";
import { phaseAccentClasses, type PhaseAccent } from "@/lib/utils/phase-colors";

type FlowStep = {
  step: number;
  label: string;
  href: string;
  icon: typeof Mic;
  description: string;
  badge?: number;
  phase: PhaseAccent;
};

function FlowStepLink({ item }: { item: FlowStep }) {
  const Icon = item.icon;
  const accent = phaseAccentClasses[item.phase];

  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 shadow-sm transition-colors hover:bg-capture-surface active:bg-muted"
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          accent.step
        )}
      >
        {item.step}
      </span>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          accent.icon
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-medium">
          {item.label}
          {item.badge !== undefined && item.badge > 0 && (
            <Badge
              className={cn(
                "min-w-5 justify-center px-1.5 text-[10px]",
                accent.badge
              )}
            >
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
}

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

  const flowSteps: FlowStep[] = [
    {
      step: 1,
      label: "録音画面",
      href: "/capture",
      icon: Mic,
      description: "思考を話す・テキスト入力",
      phase: "capture",
    },
    {
      step: 2,
      label: "未整理 Inbox",
      href: "/inbox",
      icon: Inbox,
      description: "Inbox Zero — 仕事として確定",
      badge: inboxCount,
      phase: "organize",
    },
    {
      step: 3,
      label: "今日やること",
      href: "/capture/tasks",
      icon: ListTodo,
      description: "確定したタスクを完了",
      badge: taskCount,
      phase: "execute",
    },
  ];

  return (
    <div className="min-h-dvh bg-background px-6 pb-8 pt-4">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Work Capture</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Capture → Organize → Execute
          </p>
        </div>
        <Link
          href="/capture"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-lg" }),
            "shrink-0"
          )}
          aria-label="閉じる"
        >
          <X className="size-6" strokeWidth={2} />
        </Link>
      </div>

      <p className="mb-3 text-xs font-medium text-muted-foreground">
        この順番で進めます
      </p>

      <nav>
        {flowSteps.map((item, index) => (
          <div key={item.href}>
            <FlowStepLink item={item} />
            {index < flowSteps.length - 1 && (
              <div
                className="flex justify-center py-1.5 text-muted-foreground"
                aria-hidden
              >
                <ChevronDown className="size-5" strokeWidth={2.5} />
              </div>
            )}
          </div>
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
    </div>
  );
}
