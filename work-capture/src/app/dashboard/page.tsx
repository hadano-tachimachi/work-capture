"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TaskCard, type TaskSummary } from "@/components/dashboard/task-card";
import { TaskDetailContent } from "@/components/dashboard/task-detail-content";
import { TaskEmptyState } from "@/components/dashboard/task-empty-state";
import { PcWorkHeader } from "@/components/shared/pc-work-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/services/tasks";

type TaskRow = TaskSummary & {
  description: string | null;
  context: string | null;
  assignedTo: string | null;
};

export default function DashboardPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inboxCount, setInboxCount] = useState(0);
  const [detail, setDetail] = useState<{
    nextAction: string | null;
    notes: string[];
  }>({ nextAction: null, notes: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hadTasks, setHadTasks] = useState(false);
  const hasInitializedSelection = useRef(false);

  const loadTasks = useCallback(async () => {
    const [tasksRes, inboxRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/inbox/count"),
    ]);
    const tasksData = await tasksRes.json();
    const inboxData = await inboxRes.json();
    const list: TaskRow[] = tasksData.tasks ?? [];
    setTasks(list);
    setInboxCount(inboxData.count ?? 0);
    if (list.length > 0) setHadTasks(true);
    return list;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const list = await loadTasks();
      if (cancelled) return;

      if (!hasInitializedSelection.current && list.length > 0) {
        hasInitializedSelection.current = true;
        const firstTodo = list.find((t) => t.status === "todo");
        setSelectedId((firstTodo ?? list[0]).id);
      }

      setLoading(false);
    }

    void init();
    return () => {
      cancelled = true;
    };
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
        setSelectedId(next?.id ?? null);
      } else {
        const still = list.find((t) => t.id === currentId);
        setSelectedId(
          still?.id ??
            list.find((t) => t.status === "todo")?.id ??
            list[0]?.id ??
            null
        );
      }
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
          Dashboard は PC 向けです。スマホではメニューから「今日やること」をご利用ください。
        </p>
        <Link
          href="/capture/tasks"
          className={cn(buttonVariants({ size: "lg" }))}
        >
          今日やることへ
        </Link>
      </div>

      <div className="hidden min-h-dvh flex-col md:flex">
      <PcWorkHeader
        mode="dashboard"
        inboxCount={inboxCount}
        taskCount={todoTasks.length}
        trailing={
          tasks.length > 0 ? (
            <span className="text-sm text-muted-foreground">
              未完了 {tasks.length} 件
              {holdTasks.length > 0 && `（保留 ${holdTasks.length}）`}
            </span>
          ) : undefined
        }
      />

      {tasks.length === 0 ? (
        <TaskEmptyState allDone={hadTasks} />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-r bg-muted/20 p-3">
            <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">
              今日やること
            </p>
            {todoTasks.length === 0 && holdTasks.length > 0 && (
              <p className="mb-2 px-1 text-xs text-muted-foreground">
                進行中のタスクはありません
              </p>
            )}
            {todoTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                selected={selectedId === task.id}
                onClick={() => setSelectedId(task.id)}
                className="mb-2"
              />
            ))}
            {holdTasks.length > 0 && (
              <>
                <p className="mb-2 mt-4 px-1 text-xs font-medium text-muted-foreground">
                  保留
                </p>
                {holdTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    selected={selectedId === task.id}
                    onClick={() => setSelectedId(task.id)}
                    className="mb-2"
                  />
                ))}
              </>
            )}
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
                updateStatus(selected.status === "on_hold" ? "todo" : "on_hold")
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

      <div className="hidden border-t px-6 py-2 text-center text-xs text-muted-foreground md:block">
        Capture → Inbox Zero → Dashboard の順で仕事が前に進みます
      </div>
      </div>
    </>
  );
}
