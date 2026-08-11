"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SectionCard } from "@/components/shared/section-card";
import { ValidationFailedAlert } from "@/components/shared/validation-failed-alert";
import { ITEM_TYPE_LABELS } from "@/lib/utils/capture-helpers";
import { formatDueDateDisplay, normalizeDueDateValue } from "@/lib/utils/date-helpers";
import { cn } from "@/lib/utils";

type StructuredItem = {
  type: string;
  content: string;
  sortOrder: number | null;
};

type ReviewViewProps = {
  captureId: string;
};

export function ReviewView({ captureId }: ReviewViewProps) {
  const router = useRouter();
  const [transcript, setTranscript] = useState("");
  const [items, setItems] = useState<StructuredItem[]>([]);
  const [validationStatus, setValidationStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [transcriptOpen, setTranscriptOpen] = useState(true);

  useEffect(() => {
    fetch(`/api/captures?id=${captureId}`)
      .then((r) => r.json())
      .then((data) => {
        setTranscript(data.capture?.transcriptText ?? "");
        setItems(data.items ?? []);
        setValidationStatus(data.parseResult?.validationStatus ?? "");
      })
      .finally(() => setLoading(false));
  }, [captureId]);

  function getByType(type: string) {
    return items.filter((i) => i.type === type).map((i) => i.content);
  }

  async function handleNext() {
    setSaving(true);
    setError("");
    try {
      await fetch("/api/captures", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          captureId,
          action: "ready_for_review",
        }),
      });
      router.push(`/capture/complete?id=${captureId}`);
    } catch {
      setError("処理に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  const tasks = getByType("task");
  const steps = getByType("action");
  const dueDateRaw = getByType("due_date")[0] ?? "";
  const dueDate = normalizeDueDateValue(dueDateRaw) ?? "";
  const memos = getByType("note");
  const nextAction = getByType("next_action")[0] ?? "";
  const decisions = getByType("decision");
  const purpose = getByType("purpose")[0] ?? "";
  const backgrounds = getByType("background");
  const uncertainties = getByType("uncertainty");

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        読み込み中…
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/capture")}
            aria-label="戻る"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="font-semibold">AI解析結果</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground"
          onClick={() => router.push("/capture")}
        >
          <Mic className="size-4" />
          録音し直す
        </Button>
      </header>

      <main className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-28">
        <ValidationFailedAlert
          captureId={captureId}
          validationStatus={validationStatus}
          message="AI解析の検証に失敗しました。内容を確認・修正して登録できます。"
        />

        <Collapsible open={transcriptOpen} onOpenChange={setTranscriptOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border bg-capture-surface px-4 py-3 text-sm font-medium">
            元の音声（文字起こし）
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                transcriptOpen && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 rounded-xl border bg-card p-4 text-sm leading-relaxed">
            {transcript || "（文字起こしなし）"}
          </CollapsibleContent>
        </Collapsible>

        {uncertainties.length > 0 && (
          <SectionCard
            label={ITEM_TYPE_LABELS.uncertainty}
            preview={uncertainties.join(" / ")}
            interactive={false}
            variant="warning"
          />
        )}

        {purpose && (
          <SectionCard
            label={ITEM_TYPE_LABELS.purpose}
            preview={purpose}
            interactive={false}
          />
        )}

        {backgrounds.length > 0 && (
          <SectionCard
            label={ITEM_TYPE_LABELS.background}
            preview={backgrounds.join(" / ")}
            interactive={false}
          />
        )}

        {steps.length > 0 && (
          <SectionCard
            label={ITEM_TYPE_LABELS.action}
            preview={
              <ol className="space-y-1">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-muted-foreground">{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            }
            interactive={false}
          />
        )}

        {tasks.length > 0 && (
          <SectionCard
            label={ITEM_TYPE_LABELS.task}
            preview={
              <ul className="space-y-1">
                {tasks.map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-muted-foreground">□</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            }
            interactive={false}
          />
        )}

        {dueDate && (
          <SectionCard
            label={ITEM_TYPE_LABELS.due_date}
            preview={formatDueDateDisplay(dueDate)}
            interactive={false}
          />
        )}

        {memos.length > 0 && (
          <SectionCard
            label={ITEM_TYPE_LABELS.note}
            preview={memos.join(" / ")}
            interactive={false}
          />
        )}

        {decisions.length > 0 && (
          <SectionCard
            label={ITEM_TYPE_LABELS.decision}
            preview={decisions.join(" / ")}
            interactive={false}
          />
        )}

        {nextAction && (
          <SectionCard
            label={ITEM_TYPE_LABELS.next_action}
            preview={nextAction}
            interactive={false}
          />
        )}
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
        {error && (
          <p className="mb-2 text-sm text-destructive">{error}</p>
        )}
        <Button size="lg" className="w-full" onClick={handleNext} disabled={saving}>
          {saving ? "処理中…" : "内容を確認して次へ"}
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          担当・優先度・Plan/Taskの決定などはInboxで行います
        </p>
      </footer>
    </div>
  );
}
