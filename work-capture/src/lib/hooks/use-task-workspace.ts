"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TaskSummary } from "@/components/dashboard/task-card";
import type { TaskStatus } from "@/lib/services/tasks";

export type TaskView = "active" | "completed";

export type TaskRow = TaskSummary & {
  description: string | null;
  context: string | null;
  assignedTo: string | null;
};

type UseTaskWorkspaceOptions = {
  loadInboxCount?: boolean;
};

export function useTaskWorkspace(options: UseTaskWorkspaceOptions = {}) {
  const { loadInboxCount = false } = options;
  const [view, setView] = useState<TaskView>("active");
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inboxCount, setInboxCount] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
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
    setActiveCount(data.active ?? 0);
  }, []);

  const loadTasks = useCallback(async () => {
    const url =
      view === "completed" ? "/api/tasks?status=done" : "/api/tasks";
    const requests: Promise<Response>[] = [fetch(url)];

    if (loadInboxCount) {
      requests.push(fetch("/api/inbox/count"));
    }

    const [tasksRes, inboxRes] = await Promise.all(requests);
    const tasksData = await tasksRes.json();
    const list: TaskRow[] = tasksData.tasks ?? [];
    setTasks(list);

    if (view === "active" && list.length > 0) {
      setHadActiveTasks(true);
    }

    if (loadInboxCount && inboxRes) {
      const inboxData = await inboxRes.json();
      setInboxCount(inboxData.count ?? 0);
    }

    void loadCounts();
    return list;
  }, [view, loadInboxCount, loadCounts]);

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

      if (status === "done" && view === "active") {
        setSelectedId(selectNextAfterRemoval(list, currentId));
      } else if (status === "todo" && view === "completed") {
        setSelectedId(selectNextAfterRemoval(list, currentId));
      } else {
        const still = list.find((t) => t.id === currentId);
        setSelectedId(
          still?.id ?? selectNextAfterRemoval(list, currentId)
        );
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
      const res = await fetch(`/api/tasks/${currentId}`, {
        method: "DELETE",
      });
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

  return {
    view,
    setView,
    tasks,
    selectedId,
    setSelectedId,
    inboxCount,
    doneCount,
    activeCount,
    detail,
    loading,
    saving,
    hadActiveTasks,
    todoTasks,
    holdTasks,
    selected,
    updateStatus,
    removeTask,
  };
}
