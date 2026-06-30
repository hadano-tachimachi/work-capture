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
import { EditTasksSheet } from "@/components/mobile/edit-tasks-sheet";
import { EditDeadlineSheet } from "@/components/mobile/edit-deadline-sheet";
import { EditMemoSheet } from "@/components/mobile/edit-memo-sheet";
import { EditNextStepSheet } from "@/components/mobile/edit-next-step-sheet";
import { ITEM_TYPE_LABELS } from "@/lib/utils/capture-helpers";
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
  const [openSheet, setOpenSheet] = useState<
    "tasks" | "deadline" | "memo" | "next" | null
  >(null);

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

  function setByType(type: string, values: string[]) {
    setItems((prev) => {
      const other = prev.filter((i) => i.type !== type);
      const newItems = values.map((content, i) => ({
        type,
        content,
        sortOrder: i,
      }));
      return [...other, ...newItems];
    });
  }

  async function handleRegister() {
    setSaving(true);
    setError("");
    try {
      await fetch("/api/captures", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          captureId,
          action: "update_items",
          items: items.map((item, i) => ({
            type: item.type,
            content: item.content,
            sortOrder: i,
          })),
        }),
      });
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
      setError("登録に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  const tasks = getByType("task");
  const dueDate = getByType("due_date")[0] ?? "";
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
        {validationStatus === "failed" && (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm">
            AI解析の検証に失敗しました。内容を確認・修正して登録できます。
          </div>
        )}

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

        <SectionCard
          label={ITEM_TYPE_LABELS.task}
          preview={
            tasks.length > 0 ? (
              <ul className="space-y-1">
                {tasks.map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-muted-foreground">□</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            ) : (
              "タップしてタスクを追加"
            )
          }
          onClick={() => setOpenSheet("tasks")}
        />

        <SectionCard
          label={ITEM_TYPE_LABELS.due_date}
          preview={dueDate || "タップして期限を設定"}
          onClick={() => setOpenSheet("deadline")}
        />

        <SectionCard
          label={ITEM_TYPE_LABELS.note}
          preview={memos.length > 0 ? memos.join(" / ") : "なし"}
          onClick={() => setOpenSheet("memo")}
        />

        {decisions.length > 0 && (
          <SectionCard
            label={ITEM_TYPE_LABELS.decision}
            preview={decisions.join(" / ")}
            interactive={false}
          />
        )}

        <SectionCard
          label={ITEM_TYPE_LABELS.next_action}
          preview={nextAction || "タップして次の一歩を選択"}
          onClick={() => setOpenSheet("next")}
        />
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
        {error && (
          <p className="mb-2 text-sm text-destructive">{error}</p>
        )}
        <Button className="w-full" onClick={handleRegister} disabled={saving}>
          {saving ? "登録中…" : "この内容で登録"}
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          各項目をタップして内容を編集できます
        </p>
      </footer>

      <EditTasksSheet
        open={openSheet === "tasks"}
        onOpenChange={(o) => !o && setOpenSheet(null)}
        tasks={tasks}
        onSave={(v) => setByType("task", v)}
      />
      <EditDeadlineSheet
        open={openSheet === "deadline"}
        onOpenChange={(o) => !o && setOpenSheet(null)}
        value={dueDate}
        onSave={(v) => setByType("due_date", v ? [v] : [])}
      />
      <EditMemoSheet
        open={openSheet === "memo"}
        onOpenChange={(o) => !o && setOpenSheet(null)}
        memos={memos}
        onSave={(v) => setByType("note", v)}
      />
      <EditNextStepSheet
        open={openSheet === "next"}
        onOpenChange={(o) => !o && setOpenSheet(null)}
        value={nextAction}
        taskOptions={tasks}
        onSave={(v) => setByType("next_action", v ? [v] : [])}
      />
    </div>
  );
}
