"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { TaskSummary } from "@/components/dashboard/task-card";
import { TaskCompletedEmptyState } from "@/components/dashboard/task-completed-empty-state";
import { TaskDetailContent } from "@/components/dashboard/task-detail-content";
import { TaskEmptyState } from "@/components/dashboard/task-empty-state";
import { TaskListPanel } from "@/components/dashboard/task-list-panel";
import { TaskViewTabs } from "@/components/dashboard/task-view-tabs";
import { PcWorkHeader } from "@/components/shared/pc-work-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { phaseAccentClasses } from "@/lib/utils/phase-colors";
import type { TaskStatus } from "@/lib/services/tasks";

type TaskRow = TaskSummary & {
  description: string | null;
  context: string | null;
  assignedTo: string | null;
};

export default function DashboardPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"active" | "completed">("active");
  const [inboxCount, setInboxCount] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [activeCountTotal, setActiveCountTotal] = useState(0);
  const [detail, setDetail] = useState<{
    nextAction: string | null;
    notes: string[];
  }>({ nextAction: null, notes: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hadActiveTasks, setHadActiveTasks] = useState(false);
  const hasInitializedSelection = useRef(false);

  const loadCounts = useCallback(async () => {
    const res = await fetch("/api/tasks/count");
    const data = await res.json();
    setDoneCount(data.done ?? 0);
    setActiveCountTotal(data.active ?? 0);
  }, []);

  const loadTasks = useCallback(async () => {
    const url =
      view === "completed" ? "/api/tasks?status=done" : "/api/tasks";
    const [tasksRes, inboxRes] = await Promise.all([
      fetch(url),
      fetch("/api/inbox/count"),
    ]);
    const tasksData = await tasksRes.json();
    const inboxData = await inboxRes.json();
    const list: TaskRow[] = tasksData.tasks ?? [];
    setTasks(list);
    setInboxCount(inboxData.count ?? 0);
    if (view === "active" && list.length > 0) setHadActiveTasks(true);
    void loadCounts();
    return list;
  }, [view, loadCounts]);

  useEffect(() => {
    let cancelled = false;
    hasInitializedSelection.current = false;

    async function init() {
      setLoading(true);
      const list = await loadTasks();
      if (cancelled) return;

      if (list.length > 0) {
        hasInitializedSelection.current = true;
        const first =
          view === "completed"
            ? list[0]
            : (list.find((t) => t.status === "todo") ?? list[0]);
        setSelectedId(first.id);
      } else {
        setSelectedId(null);
      }

      setLoading(false);
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [loadTasks, view]);

  useEffect(() => {
    if (!selectedId) {
      setDetail({ nextAction: null, notes: [] });
      return;
    }

    let cancelled = false;

    async function loadDetail() {
      const res = await fetch(`/api/tasks/${selectedId}`);
      const data = await res.json();
      if (cancelled) return;
      setDetail({
        nextAction: data.nextAction ?? null,
        notes: data.notes ?? [],
      });
    }

    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  function selectNextAfterRemoval(
    list: TaskRow[],
    removedId: string
  ): string | null {
    const index = list.findIndex((t) => t.id === removedId);
    const remaining = list.filter((t) => t.id !== removedId);
    if (remaining.length === 0) return null;

    if (view === "completed") {
      return remaining[Math.min(index, remaining.length - 1)]?.id ?? null;
    }

    const nextTodo = remaining.find((t) => t.status === "todo");
    return nextTodo?.id ?? remaining[0]?.id ?? null;
  }

  async function updateStatus(status: TaskStatus) {
    if (!selectedId) return;
    const currentId = selectedId;
    setSaving(true);
    try {
      await fetch(`/api/tasks/${currentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const list = await loadTasks();

      if ((status === "done" && view === "active") || (status === "todo" && view === "completed")) {
        setSelectedId(selectNextAfterRemoval(list, currentId));
      } else {
        const still = list.find((t) => t.id === currentId);
        setSelectedId(still?.id ?? selectNextAfterRemoval(list, currentId));
      }
    } finally {
      setSaving(false);
    }
  }

  async function removeTask() {
    if (!selectedId) return;
    if (!window.confirm("このタスクを削除しますか？")) return;

    const currentId = selectedId;
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${currentId}`, { method: "DELETE" });
      if (!res.ok) return;

      const list = await loadTasks();
      setSelectedId(selectNextAfterRemoval(list, currentId));
    } finally {
      setSaving(false);
    }
  }

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const holdTasks = tasks.filter((t) => t.status === "on_hold");
  const selected = tasks.find((t) => t.id === selectedId);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        読み込み中…
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 md:hidden">
        <p className="text-center text-muted-foreground">
          ワイドレイアウト向けの画面です。「今日やること」から操作できます。
        </p>
        <Link
          href="/capture/tasks"
          className={cn(buttonVariants({ size: "lg" }))}
        >
          今日やることへ
        </Link>
      </div>

      <div className="hidden h-dvh flex-col overflow-hidden md:flex">
        <PcWorkHeader
          mode="dashboard"
          inboxCount={inboxCount}
          taskCount={todoTasks.length}
          trailing={
            view === "active" && tasks.length > 0 ? (
              <span className={cn("text-sm", phaseAccentClasses.execute.text)}>
                未完了 {tasks.length} 件
                {holdTasks.length > 0 && `（保留 ${holdTasks.length}）`}
              </span>
            ) : view === "completed" && tasks.length > 0 ? (
              <span className={cn("text-sm", phaseAccentClasses.execute.text)}>
                完了済み {tasks.length} 件
              </span>
            ) : undefined
          }
        />

        <div className="shrink-0 border-b px-4 py-3 md:px-6">
          <TaskViewTabs
            view={view}
            onViewChange={setView}
            activeCount={activeCountTotal}
            doneCount={doneCount}
          />
        </div>

        {view === "active" && tasks.length === 0 ? (
          <TaskEmptyState allDone={hadActiveTasks} />
        ) : view === "completed" && tasks.length === 0 ? (
          <TaskCompletedEmptyState />
        ) : (
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <aside className="flex w-72 min-h-0 shrink-0 flex-col overflow-y-auto border-r bg-muted/20 p-3">
              <p
                className={cn(
                  "mb-2 px-1 text-xs font-medium",
                  phaseAccentClasses.execute.text
                )}
              >
                {view === "completed" ? "完了済み" : "今日やること"}
              </p>
              <TaskListPanel
                view={view}
                todoTasks={todoTasks}
                holdTasks={holdTasks}
                completedTasks={tasks}
                selectedId={selectedId}
                onSelect={setSelectedId}
                cardClassName="mb-2"
              />
            </aside>

            {selected ? (
              <TaskDetailContent
                title={selected.title}
                description={selected.description}
                priority={selected.priority}
                dueDate={selected.dueDate}
                project={selected.project}
                context={selected.context}
                assignedTo={selected.assignedTo}
                nextAction={detail.nextAction}
                notes={detail.notes}
                status={selected.status}
                saving={saving}
                onComplete={() => updateStatus("done")}
                onHold={() =>
                  updateStatus(
                    selected.status === "on_hold" ? "todo" : "on_hold"
                  )
                }
                onDelete={removeTask}
                onRestore={
                  selected.status === "done"
                    ? () => updateStatus("todo")
                    : undefined
                }
                className="min-w-0 flex-1"
              />
            ) : (
              <div className="flex flex-1 items-center justify-center text-muted-foreground">
                左からタスクを選択してください
              </div>
            )}
          </div>
        )}

        <div className="hidden shrink-0 border-t px-6 py-2 text-center text-xs text-muted-foreground md:block">
          Capture → Inbox Zero → Dashboard の順で仕事が前に進みます
        </div>
      </div>
    </>
  );
}
