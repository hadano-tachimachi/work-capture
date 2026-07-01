"use client";

import { TaskCard } from "@/components/dashboard/task-card";
import type { TaskRow, TaskView } from "@/lib/hooks/use-task-workspace";

type TaskListPanelProps = {
  view: TaskView;
  todoTasks: TaskRow[];
  holdTasks: TaskRow[];
  completedTasks: TaskRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  cardClassName?: string;
};

export function TaskListPanel({
  view,
  todoTasks,
  holdTasks,
  completedTasks,
  selectedId,
  onSelect,
  cardClassName,
}: TaskListPanelProps) {
  if (view === "completed") {
    return (
      <>
        {completedTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            selected={selectedId === task.id}
            onClick={() => onSelect(task.id)}
            className={cardClassName}
          />
        ))}
      </>
    );
  }

  return (
    <>
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
          onClick={() => onSelect(task.id)}
          className={cardClassName}
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
              onClick={() => onSelect(task.id)}
              className={cardClassName}
            />
          ))}
        </>
      )}
    </>
  );
}
