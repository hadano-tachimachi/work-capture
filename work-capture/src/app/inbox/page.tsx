"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Menu, Mic } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PcWorkHeader } from "@/components/shared/pc-work-header";
import { EditTasksSheet } from "@/components/mobile/edit-tasks-sheet";
import { EditDeadlineSheet } from "@/components/mobile/edit-deadline-sheet";
import { EditMemoSheet } from "@/components/mobile/edit-memo-sheet";
import { EditNextStepSheet } from "@/components/mobile/edit-next-step-sheet";
import {
  InboxCaptureCard,
  type InboxCapture,
} from "@/components/inbox/inbox-capture-card";
import { InboxDetailContent } from "@/components/inbox/inbox-detail-content";
import { InboxEmptyState } from "@/components/inbox/inbox-empty-state";
import { InboxProgress } from "@/components/inbox/inbox-progress";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { normalizeDueDateValue } from "@/lib/utils/date-helpers";

type StructuredItem = {
  type: string;
  content: string;
  sortOrder: number | null;
};

export default function InboxPage() {
  const isMobile = useIsMobile();
  const [captures, setCaptures] = useState<InboxCapture[]>([]);
  const [initialCount, setInitialCount] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
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
  const [taskCount, setTaskCount] = useState(0);
  const processedRef = useRef(0);
  const hasInitializedSelection = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [capturesRes, tasksCountRes] = await Promise.all([
        fetch("/api/captures"),
        fetch("/api/tasks/count"),
      ]);
      const data = await capturesRes.json();
      const tasksData = await tasksCountRes.json();
      if (cancelled) return;
      const list: InboxCapture[] = data.captures ?? [];
      setCaptures(list);
      setTaskCount(tasksData.todo ?? 0);
      setInitialCount((prev) =>
        prev === null && list.length > 0 ? list.length : prev
      );

      if (!hasInitializedSelection.current) {
        hasInitializedSelection.current = true;
        const mobile = window.matchMedia("(max-width: 767px)").matches;
        if (!mobile && list.length > 0) {
          setSelectedId(list[0].id);
        }
      }

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
      setDueDate(normalizeDueDateValue(due?.content ?? "") ?? "");
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
      const list: InboxCapture[] = data.captures ?? [];
      setCaptures(list);

      if (isMobile) {
        if (list.length > 0) {
          setSelectedId(list[0].id);
          setMobileShowDetail(true);
        } else {
          setSelectedId(null);
          setMobileShowDetail(false);
        }
      } else {
        setSelectedId(list[0]?.id ?? null);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleSelectCapture(id: string) {
    setSelectedId(id);
    if (isMobile) {
      setMobileShowDetail(true);
    }
  }

  function handleMobileBack() {
    setMobileShowDetail(false);
  }

  const tasks = getByType("task");
  const memos = getByType("note");
  const nextAction = getByType("next_action")[0] ?? "";
  const processedCount = processedRef.current;
  const totalCount = initialCount ?? captures.length;
  const currentIndex = totalCount - captures.length + 1;

  const selectedCapture = captures.find((c) => c.id === selectedId);

  const detailProps = {
    captureId: selectedId ?? undefined,
    transcript,
    inputType: selectedCapture?.inputType,
    createdAt: selectedCapture?.createdAt,
    validationStatus,
    tasks,
    memos,
    nextAction,
    dueDate,
    assignedTo,
    priority,
    project,
    context,
    saving,
    getByType,
    onOpenSheet: setOpenSheet,
    onAssignedToChange: setAssignedTo,
    onPriorityChange: setPriority,
    onProjectChange: setProject,
    onContextChange: setContext,
    onDueDateChange: (v: string) => setByType("due_date", v ? [v] : []),
    onAction: handleAction,
  };

  const editSheets = (
    <>
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
    </>
  );

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        読み込み中…
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* ── Mobile ── */}
      <div className="flex min-h-dvh flex-col md:hidden">
        {captures.length === 0 ? (
          <>
            <header className="flex items-center justify-between border-b px-4 py-3">
              <Link
                href="/capture/menu"
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                aria-label="メニュー"
              >
                <Menu className="size-5" />
              </Link>
              <span className="text-sm font-semibold">未整理 Inbox</span>
              <Link
                href="/capture"
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                aria-label="録音画面へ"
              >
                <Mic className="size-5" />
              </Link>
            </header>
            <InboxEmptyState processedCount={processedCount} />
          </>
        ) : mobileShowDetail && selectedId ? (
          <>
            <header className="flex items-center gap-2 border-b px-2 py-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMobileBack}
                aria-label="一覧に戻る"
              >
                <ArrowLeft className="size-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <InboxProgress
                  currentIndex={currentIndex}
                  totalCount={totalCount}
                  remaining={captures.length}
                />
              </div>
              <Link
                href="/capture"
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                aria-label="録音画面へ"
              >
                <Mic className="size-5" />
              </Link>
            </header>
            <InboxDetailContent {...detailProps} compact className="flex-1" />
          </>
        ) : (
          <>
            <header className="flex items-center justify-between border-b px-4 py-3">
              <Link
                href="/capture/menu"
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                aria-label="メニュー"
              >
                <Menu className="size-5" />
              </Link>
              <span className="text-sm font-semibold">未整理 Inbox</span>
              <Link
                href="/capture"
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                aria-label="録音画面へ"
              >
                <Mic className="size-5" />
              </Link>
            </header>
            <div className="border-b px-4 py-3">
              <InboxProgress
                currentIndex={currentIndex}
                totalCount={totalCount}
                remaining={captures.length}
              />
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {captures.map((c) => (
                <InboxCaptureCard
                  key={c.id}
                  capture={c}
                  selected={selectedId === c.id}
                  onClick={() => handleSelectCapture(c.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Desktop ── */}
      <div className="hidden h-dvh flex-col overflow-hidden md:flex">
        <PcWorkHeader
          mode="inbox"
          inboxCount={captures.length}
          taskCount={taskCount}
          trailing={
            totalCount > 0 ? (
              <span className="text-sm text-muted-foreground">
                {captures.length > 0
                  ? `${currentIndex} / ${totalCount} 件目 · 残り ${captures.length} 件`
                  : `${processedCount} 件処理済み`}
              </span>
            ) : undefined
          }
        />

        {captures.length === 0 ? (
          <InboxEmptyState processedCount={processedCount} />
        ) : (
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <aside className="w-72 min-h-0 shrink-0 overflow-y-auto border-r bg-muted/20 p-3">
              {captures.map((c) => (
                <InboxCaptureCard
                  key={c.id}
                  capture={c}
                  selected={selectedId === c.id}
                  onClick={() => setSelectedId(c.id)}
                  className="mb-2"
                />
              ))}
            </aside>

            <InboxDetailContent {...detailProps} className="min-w-0 flex-1" />
          </div>
        )}
      </div>

      {editSheets}
    </div>
  );
}
