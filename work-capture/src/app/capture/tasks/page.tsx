"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Menu, Mic } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskCompletedEmptyState } from "@/components/dashboard/task-completed-empty-state";
import { TaskDetailContent } from "@/components/dashboard/task-detail-content";
import { TaskEmptyState } from "@/components/dashboard/task-empty-state";
import { TaskListPanel } from "@/components/dashboard/task-list-panel";
import { TaskViewTabs } from "@/components/dashboard/task-view-tabs";
import { useTaskWorkspace } from "@/lib/hooks/use-task-workspace";

export default function CaptureTasksPage() {
  const {
    view,
    setView,
    tasks,
    selectedId,
    setSelectedId,
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
  } = useTaskWorkspace();

  const [showDetail, setShowDetail] = useState(false);

  function handleSelect(id: string) {
    setSelectedId(id);
    setShowDetail(true);
  }

  const listTitle = view === "completed" ? "完了済み" : "今日やること";

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        読み込み中…
      </div>
    );
  }

  if (showDetail && selected) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
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
          onDelete={removeTask}
          onRestore={
            selected.status === "done" ? () => updateStatus("todo") : undefined
          }
          className="flex-1"
        />
      </div>
    );
  }

  const isEmptyActive = view === "active" && tasks.length === 0;
  const isEmptyCompleted = view === "completed" && tasks.length === 0;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <Link
          href="/capture/menu"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          aria-label="メニュー"
        >
          <Menu className="size-5" />
        </Link>
        <span className="text-sm font-semibold">{listTitle}</span>
        <Link
          href="/capture"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          aria-label="録音画面へ"
        >
          <Mic className="size-5" />
        </Link>
      </header>

      <div className="border-b px-4 py-3">
        <TaskViewTabs
          view={view}
          onViewChange={setView}
          activeCount={activeCount}
          doneCount={doneCount}
        />
      </div>

      {isEmptyActive ? (
        <TaskEmptyState allDone={hadActiveTasks} />
      ) : isEmptyCompleted ? (
        <TaskCompletedEmptyState />
      ) : (
        <>
          <div className="border-b px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {view === "completed"
                ? `完了済み ${tasks.length} 件`
                : `未完了 ${tasks.length} 件`}
            </p>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            <TaskListPanel
              view={view}
              todoTasks={todoTasks}
              holdTasks={holdTasks}
              completedTasks={tasks}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          </div>
          {view === "active" && (
            <p className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
              Dashboard で詳細を確認・編集できます
            </p>
          )}
        </>
      )}
    </div>
  );
}
