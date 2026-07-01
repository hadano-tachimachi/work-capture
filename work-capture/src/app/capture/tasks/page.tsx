"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Menu, Mic } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskCard, type TaskSummary } from "@/components/dashboard/task-card";
import { TaskDetailContent } from "@/components/dashboard/task-detail-content";
import { TaskEmptyState } from "@/components/dashboard/task-empty-state";
import type { TaskStatus } from "@/lib/services/tasks";

type TaskRow = TaskSummary & {
  description: string | null;
  context: string | null;
  assignedTo: string | null;
};

export default function CaptureTasksPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState<{
    nextAction: string | null;
    notes: string[];
  }>({ nextAction: null, notes: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hadTasks, setHadTasks] = useState(false);

  const loadTasks = useCallback(async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    const list: TaskRow[] = data.tasks ?? [];
    setTasks(list);
    if (list.length > 0) setHadTasks(true);
    return list;
  }, []);

  useEffect(() => {
    void loadTasks().finally(() => setLoading(false));
  }, [loadTasks]);

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

      if (status === "done") {
        const next =
          list.find((t) => t.status === "todo") ?? list[0] ?? null;
        if (next) {
          setSelectedId(next.id);
          setShowDetail(true);
        } else {
          setSelectedId(null);
          setShowDetail(false);
        }
      } else {
        const still = list.find((t) => t.id === currentId);
        if (still) {
          setSelectedId(still.id);
          setShowDetail(true);
        } else {
          const next =
            list.find((t) => t.status === "todo") ?? list[0] ?? null;
          if (next) {
            setSelectedId(next.id);
            setShowDetail(true);
          } else {
            setSelectedId(null);
            setShowDetail(false);
          }
        }
      }
    } finally {
      setSaving(false);
    }
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    setShowDetail(true);
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
    <div className="flex min-h-dvh flex-col bg-background">
      {tasks.length === 0 ? (
        <>
          <header className="flex items-center justify-between border-b px-4 py-3">
            <Link
              href="/capture/menu"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
              aria-label="メニュー"
            >
              <Menu className="size-5" />
            </Link>
            <span className="text-sm font-semibold">今日やること</span>
            <Link
              href="/capture"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
              aria-label="録音画面へ"
            >
              <Mic className="size-5" />
            </Link>
          </header>
          <TaskEmptyState allDone={hadTasks} />
        </>
      ) : showDetail && selected ? (
        <>
          <header className="flex items-center gap-2 border-b px-2 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDetail(false)}
              aria-label="一覧に戻る"
            >
              <ArrowLeft className="size-5" />
            </Button>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              {selected.title}
            </span>
            <Link
              href="/capture"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
              aria-label="録音画面へ"
            >
              <Mic className="size-5" />
            </Link>
          </header>
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
            compact
            onComplete={() => updateStatus("done")}
            onHold={() =>
              updateStatus(selected.status === "on_hold" ? "todo" : "on_hold")
            }
            className="flex-1"
          />
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
            <span className="text-sm font-semibold">今日やること</span>
            <Link
              href="/capture"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
              aria-label="録音画面へ"
            >
              <Mic className="size-5" />
            </Link>
          </header>
          <div className="border-b px-4 py-3">
            <p className="text-sm text-muted-foreground">
              未完了 {tasks.length} 件
            </p>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {todoTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                selected={selectedId === task.id}
                onClick={() => handleSelect(task.id)}
              />
            ))}
            {holdTasks.length > 0 && (
              <>
                <p className="pt-2 text-xs font-medium text-muted-foreground">
                  保留
                </p>
                {holdTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    selected={selectedId === task.id}
                    onClick={() => handleSelect(task.id)}
                  />
                ))}
              </>
            )}
          </div>
          <p className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
            PC の Dashboard で詳細を確認・編集できます
          </p>
        </>
      )}
    </div>
  );
}
