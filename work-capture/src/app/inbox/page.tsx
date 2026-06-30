"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Inbox, Mic } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SectionCard } from "@/components/shared/section-card";
import { EditTasksSheet } from "@/components/mobile/edit-tasks-sheet";
import { EditDeadlineSheet } from "@/components/mobile/edit-deadline-sheet";
import { EditMemoSheet } from "@/components/mobile/edit-memo-sheet";
import { EditNextStepSheet } from "@/components/mobile/edit-next-step-sheet";
import {
  formatRelativeTime,
  ITEM_TYPE_LABELS,
} from "@/lib/utils/capture-helpers";

type Capture = {
  id: string;
  transcriptText: string | null;
  inputType: string;
  status: string;
  createdAt: string;
  taskCount?: number;
};

type StructuredItem = {
  type: string;
  content: string;
  sortOrder: number | null;
};

export default function InboxPage() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [initialCount, setInitialCount] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [items, setItems] = useState<StructuredItem[]>([]);
  const [validationStatus, setValidationStatus] = useState("");
  const [priority, setPriority] = useState("medium");
  const [project, setProject] = useState("");
  const [context, setContext] = useState("");
  const [assignedTo, setAssignedTo] = useState("自分");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openSheet, setOpenSheet] = useState<
    "tasks" | "deadline" | "memo" | "next" | null
  >(null);
  const processedRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch("/api/captures");
      const data = await res.json();
      if (cancelled) return;
      const list: Capture[] = data.captures ?? [];
      setCaptures(list);
      setInitialCount((prev) => (prev === null && list.length > 0 ? list.length : prev));
      setSelectedId((prev) => prev ?? list[0]?.id ?? null);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;

    async function loadDetail() {
      const res = await fetch(`/api/captures?id=${selectedId}`);
      const data = await res.json();
      if (cancelled) return;

      setTranscript(data.capture?.transcriptText ?? "");
      const grouped = (data.items ?? []) as StructuredItem[];
      setItems(grouped);
      setValidationStatus(data.parseResult?.validationStatus ?? "");
      const due = grouped.find((i) => i.type === "due_date");
      const proj = grouped.find((i) => i.type === "project_candidate");
      const ctx = grouped.find((i) => i.type === "context_candidate");
      setDueDate(due?.content ?? "");
      setProject(proj?.content ?? "");
      setContext(ctx?.content ?? "");
    }

    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

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
    if (type === "due_date") {
      setDueDate(values[0] ?? "");
    }
  }

  async function saveItemsToServer(updatedItems: StructuredItem[]) {
    if (!selectedId) return;
    await fetch("/api/captures", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        captureId: selectedId,
        action: "update_items",
        items: updatedItems.map((item, i) => ({
          type: item.type,
          content: item.content,
          sortOrder: i,
        })),
      }),
    });
  }

  async function handleSheetSave(type: string, values: string[]) {
    const other = items.filter((i) => i.type !== type);
    const newItems = values.map((content, i) => ({
      type,
      content,
      sortOrder: i,
    }));
    const updated = [...other, ...newItems];
    setItems(updated);
    if (type === "due_date") setDueDate(values[0] ?? "");
    await saveItemsToServer(updated);
  }

  async function handleAction(action: "confirm" | "skip" | "delete") {
    if (!selectedId) return;
    setSaving(true);
    try {
      if (action === "confirm") {
        const taskTitles = getByType("task");
        const purpose = getByType("purpose")[0];
        await fetch("/api/captures", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            captureId: selectedId,
            action: "confirm",
            confirmData: {
              taskTitles,
              purpose,
              dueDate,
              priority,
              project,
              context,
              assignedTo,
            },
          }),
        });
        processedRef.current += 1;
      } else {
        await fetch("/api/captures", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ captureId: selectedId, action }),
        });
        if (action === "skip" || action === "delete") {
          processedRef.current += 1;
        }
      }
      const res = await fetch("/api/captures");
      const data = await res.json();
      const list: Capture[] = data.captures ?? [];
      setCaptures(list);
      setSelectedId(list[0]?.id ?? null);
    } finally {
      setSaving(false);
    }
  }

  const tasks = getByType("task");
  const memos = getByType("note");
  const nextAction = getByType("next_action")[0] ?? "";
  const processedCount = processedRef.current;
  const totalCount = initialCount ?? captures.length;
  const currentIndex = totalCount - captures.length + 1;

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        読み込み中…
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between border-b bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-primary">Work Capture</h1>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
            未整理 inbox
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          {totalCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {captures.length > 0
                ? `${currentIndex} / ${totalCount} 件目 · 残り ${captures.length} 件`
                : `${processedCount} 件処理済み`}
            </span>
          )}
          <Link
            href="/capture"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
          >
            <Mic className="size-4" />
            スマホで追加
          </Link>
        </div>
      </header>

      {captures.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Inbox className="size-8" />
          </div>
          <p className="text-muted-foreground">
            未整理の Work Capture はありません
          </p>
          {processedCount > 0 && (
            <p className="text-sm text-primary">
              本日 {processedCount} 件を整理しました
            </p>
          )}
          <Link
            href="/capture"
            className={cn(buttonVariants(), "gap-2 justify-center")}
          >
            <Mic className="size-4" />
            思考を預ける
          </Link>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-72 shrink-0 overflow-y-auto border-r bg-muted/20 p-3">
            {captures.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "mb-2 w-full rounded-xl border bg-card p-3 text-left text-sm shadow-sm transition-colors hover:bg-capture-surface",
                  selectedId === c.id &&
                    "border-l-4 border-l-primary border-primary/30 bg-capture-surface"
                )}
              >
                <p className="line-clamp-2 font-medium">
                  {c.transcriptText?.slice(0, 60) || "（内容なし）"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(c.createdAt)}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {c.inputType === "audio" ? "音声" : "テキスト"}
                  </Badge>
                  {(c.taskCount ?? 0) > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      タスク {c.taskCount}
                    </Badge>
                  )}
                  <Badge
                    className={cn(
                      "text-[10px] px-1.5 py-0",
                      c.status === "validation_failed"
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/10"
                        : "bg-primary/10 text-primary hover:bg-primary/10"
                    )}
                  >
                    {c.status === "validation_failed" ? "要確認" : "確認待ち"}
                  </Badge>
                </div>
              </button>
            ))}
          </aside>

          <div className="grid flex-1 grid-cols-2 overflow-hidden">
            <section className="overflow-y-auto bg-muted/10 p-6">
              <h2 className="mb-4 text-sm font-medium text-muted-foreground">
                元の入力
              </h2>
              <p className="whitespace-pre-wrap rounded-xl border bg-card p-4 text-sm leading-relaxed shadow-sm">
                {transcript}
              </p>
            </section>

            <section className="flex flex-col overflow-hidden bg-background">
              <div className="flex-1 space-y-3 overflow-y-auto p-6">
                {validationStatus === "failed" && (
                  <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm">
                    AI解析の検証に失敗しました。手動で確認してください。
                  </div>
                )}

                {getByType("uncertainty").length > 0 && (
                  <SectionCard
                    label={ITEM_TYPE_LABELS.uncertainty}
                    preview={getByType("uncertainty").join(" / ")}
                    interactive={false}
                    variant="warning"
                  />
                )}

                {getByType("purpose").length > 0 && (
                  <SectionCard
                    label={ITEM_TYPE_LABELS.purpose}
                    preview={getByType("purpose")[0]}
                    interactive={false}
                  />
                )}

                {getByType("background").length > 0 && (
                  <SectionCard
                    label={ITEM_TYPE_LABELS.background}
                    preview={getByType("background").join(" / ")}
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
                      "クリックしてタスクを追加"
                    )
                  }
                  onClick={() => setOpenSheet("tasks")}
                />

                <SectionCard
                  label={ITEM_TYPE_LABELS.due_date}
                  preview={dueDate || "クリックして期限を設定"}
                  onClick={() => setOpenSheet("deadline")}
                />

                <SectionCard
                  label={ITEM_TYPE_LABELS.note}
                  preview={memos.length > 0 ? memos.join(" / ") : "なし"}
                  onClick={() => setOpenSheet("memo")}
                />

                {getByType("decision").length > 0 && (
                  <SectionCard
                    label={ITEM_TYPE_LABELS.decision}
                    preview={getByType("decision").join(" / ")}
                    interactive={false}
                  />
                )}

                <SectionCard
                  label={ITEM_TYPE_LABELS.next_action}
                  preview={nextAction || "クリックして次の一歩を選択"}
                  onClick={() => setOpenSheet("next")}
                />
              </div>

              <Card className="m-4 mt-0 shrink-0 border-primary/20 shadow-sm">
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>担当</Label>
                      <Input
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>優先度</Label>
                      <Select
                        value={priority}
                        onValueChange={(v) => v && setPriority(v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">高</SelectItem>
                          <SelectItem value="medium">中</SelectItem>
                          <SelectItem value="low">低</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>プロジェクト</Label>
                      <Input
                        value={project}
                        onChange={(e) => setProject(e.target.value)}
                        placeholder="例：見積案件"
                      />
                    </div>
                    <div>
                      <Label>コンテキスト</Label>
                      <Input
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="例：本業"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>期限</Label>
                      <Input
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleAction("confirm")}
                      disabled={saving}
                    >
                      保存して次へ
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAction("skip")}
                      disabled={saving}
                    >
                      保留
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleAction("delete")}
                      disabled={saving}
                    >
                      削除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      )}

      <EditTasksSheet
        open={openSheet === "tasks"}
        onOpenChange={(o) => !o && setOpenSheet(null)}
        tasks={tasks}
        onSave={(v) => handleSheetSave("task", v)}
      />
      <EditDeadlineSheet
        open={openSheet === "deadline"}
        onOpenChange={(o) => !o && setOpenSheet(null)}
        value={dueDate}
        onSave={(v) => handleSheetSave("due_date", v ? [v] : [])}
      />
      <EditMemoSheet
        open={openSheet === "memo"}
        onOpenChange={(o) => !o && setOpenSheet(null)}
        memos={memos}
        onSave={(v) => handleSheetSave("note", v)}
      />
      <EditNextStepSheet
        open={openSheet === "next"}
        onOpenChange={(o) => !o && setOpenSheet(null)}
        value={nextAction}
        taskOptions={tasks}
        onSave={(v) => handleSheetSave("next_action", v ? [v] : [])}
      />
    </div>
  );
}
