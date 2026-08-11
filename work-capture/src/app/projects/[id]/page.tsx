"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  FolderKanban,
  Menu,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { PcWorkHeader } from "@/components/shared/pc-work-header";
import { cn } from "@/lib/utils";
import { phaseAccentClasses } from "@/lib/utils/phase-colors";
import {
  isActiveProjectStatus,
  projectKindLabel,
  projectStatusLabel,
} from "@/lib/utils/project-display";
import {
  formatTaskDueDateShort,
  priorityLabel,
} from "@/lib/utils/task-display";
import { formatDueDateDisplay } from "@/lib/utils/date-helpers";
import {
  ProjectResultForm,
  type ResultFormValues,
} from "@/components/projects/project-result-form";

type ProjectTask = {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  priority: string | null;
};

type PlanGroup = {
  plan: {
    id: string;
    title: string;
    goal: string | null;
    context: string | null;
    dueDate: string | null;
    status: string;
  };
  steps: { id: string; content: string; sortOrder: number | null }[];
  tasks: ProjectTask[];
};

type ProjectResult = {
  id: string;
  plannedMinutes: number | null;
  actualMinutes: number | null;
  unexpected: string | null;
  nextTimeChange: string | null;
  detail: Record<string, unknown> | null;
  createdAt: string;
};

type ProjectDetailResponse = {
  project: {
    id: string;
    title: string;
    goal: string | null;
    kind: string | null;
    status: string;
  };
  planGroups: PlanGroup[];
  looseTasks: ProjectTask[];
  results: ProjectResult[];
  stats: { planCount: number; taskTotal: number; taskDone: number };
};

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [detail, setDetail] = useState<ProjectDetailResponse | null>(null);
  const [inboxCount, setInboxCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [savingResult, setSavingResult] = useState(false);
  const [reopening, setReopening] = useState(false);

  const loadDetail = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}`);
    if (res.status === 404) {
      setNotFound(true);
      setDetail(null);
      return;
    }
    if (!res.ok) {
      throw new Error("Failed to load project");
    }
    const data: ProjectDetailResponse = await res.json();
    setDetail(data);
    setNotFound(false);
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [detailRes, inboxRes, taskRes, projectsRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch("/api/inbox/count"),
          fetch("/api/tasks/count"),
          fetch("/api/projects"),
        ]);

        if (cancelled) return;

        if (detailRes.status === 404) {
          setNotFound(true);
        } else if (detailRes.ok) {
          setDetail(await detailRes.json());
        }

        const inboxData = await inboxRes.json();
        const taskData = await taskRes.json();
        const projectsData = await projectsRes.json();
        setInboxCount(inboxData.count ?? 0);
        setTaskCount(taskData.todo ?? 0);
        setProjectCount(
          (projectsData.projects ?? []).filter(
            (p: { status: string }) => isActiveProjectStatus(p.status)
          ).length
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function toggleTaskDone(task: ProjectTask) {
    const nextStatus = task.status === "done" ? "todo" : "done";
    setUpdatingTaskId(task.id);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) return;
      await loadDetail();
    } finally {
      setUpdatingTaskId(null);
    }
  }

  async function completeWithResult(values: ResultFormValues) {
    setSavingResult(true);
    try {
      if (values.kind && values.kind !== detail?.project.kind) {
        await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: values.kind }),
        });
      }

      const resultRes = await fetch(`/api/projects/${projectId}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plannedMinutes: values.plannedMinutes,
          actualMinutes: values.actualMinutes,
          unexpected: values.unexpected,
          nextTimeChange: values.nextTimeChange,
          equipment: values.equipment,
          location: values.location,
          revisionCount: values.revisionCount,
          attendees: values.attendees,
        }),
      });
      if (!resultRes.ok) return;

      const statusRes = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });
      if (!statusRes.ok) return;

      await loadDetail();
    } finally {
      setSavingResult(false);
    }
  }

  async function reopenProject() {
    setReopening(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (!res.ok) return;
      await loadDetail();
    } finally {
      setReopening(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        読み込み中…
      </div>
    );
  }

  if (notFound || !detail) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6">
        <p className="text-muted-foreground">この仕事は見つかりませんでした</p>
        <Link href="/projects" className={cn(buttonVariants())}>
          仕事一覧へ戻る
        </Link>
      </div>
    );
  }

  const { project, planGroups, looseTasks, results, stats } = detail;
  const active = isActiveProjectStatus(project.status);
  const kind = projectKindLabel(project.kind);
  const displayGoal =
    project.goal?.trim() ||
    planGroups.find((g) => g.plan.goal?.trim())?.plan.goal?.trim() ||
    null;
  const progress =
    stats.taskTotal > 0
      ? Math.round((stats.taskDone / stats.taskTotal) * 100)
      : 0;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between border-b px-2 py-3 md:hidden">
        <Link
          href="/projects"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          aria-label="仕事一覧へ戻る"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <span
          className={cn(
            "min-w-0 flex-1 truncate px-2 text-center text-sm font-semibold",
            phaseAccentClasses.project.text
          )}
        >
          {project.title}
        </span>
        <Link
          href="/capture/menu"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          aria-label="メニュー"
        >
          <Menu className="size-5" />
        </Link>
      </header>

      <div className="hidden md:block">
        <PcWorkHeader
          mode="projects"
          inboxCount={inboxCount}
          projectCount={projectCount}
          taskCount={taskCount}
          trailing={
            <Link
              href="/projects"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1"
              )}
            >
              <ArrowLeft className="size-4" />
              一覧へ
            </Link>
          }
        />
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 md:px-6 md:py-8">
        <div className="mb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                "px-1.5 py-0 text-[10px]",
                active
                  ? phaseAccentClasses.project.badgeSoft
                  : "bg-muted text-muted-foreground hover:bg-muted"
              )}
            >
              {projectStatusLabel(project.status)}
            </Badge>
            {kind && (
              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                {kind}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              道筋 {stats.planCount} · タスク {stats.taskDone}/{stats.taskTotal}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {project.title}
          </h1>

          {displayGoal && (
            <section className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p
                className={cn(
                  "mb-1 text-xs font-semibold uppercase tracking-wide",
                  phaseAccentClasses.project.text
                )}
              >
                Goal（何が達成されたら完了か）
              </p>
              <p className="text-sm leading-relaxed md:text-base">
                {displayGoal}
              </p>
            </section>
          )}

          {stats.taskTotal > 0 && (
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>進捗</span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-tertiary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {planGroups.length === 0 && looseTasks.length === 0 ? (
            <EmptyProjectBody />
          ) : (
            <>
              {planGroups.map((group, index) => (
                <PlanGroupSection
                  key={group.plan.id}
                  group={group}
                  index={index}
                  updatingTaskId={updatingTaskId}
                  onToggleTask={toggleTaskDone}
                />
              ))}

              {looseTasks.length > 0 && (
                <section>
                  <SectionHeading
                    label="Planに属していないタスク"
                    hint="この仕事に紐づく単発タスク"
                  />
                  <TaskList
                    tasks={looseTasks}
                    updatingTaskId={updatingTaskId}
                    onToggle={toggleTaskDone}
                  />
                </section>
              )}
            </>
          )}

          {results.length > 0 && (
            <section>
              <SectionHeading
                label="Result（振り返り）"
                hint="この仕事から残した学び"
              />
              <div className="space-y-3">
                {results.map((result) => (
                  <ResultCard key={result.id} result={result} />
                ))}
              </div>
            </section>
          )}

          {active ? (
            <ProjectResultForm
              initialKind={project.kind}
              saving={savingResult}
              onSubmit={completeWithResult}
            />
          ) : (
            <div className="rounded-xl border border-dashed px-4 py-5 text-center">
              <p className="text-sm text-muted-foreground">
                この仕事は完了済みです。Result は上に表示されています。
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                disabled={reopening}
                onClick={reopenProject}
              >
                {reopening ? "処理中…" : "進行中に戻す"}
              </Button>
            </div>
          )}
        </div>
      </main>

      <p className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
        Goal → Plan → Steps → Tasks の順で、「なぜこのタスクがあるのか」を辿れます
      </p>
    </div>
  );
}

function EmptyProjectBody() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full",
          phaseAccentClasses.project.icon
        )}
      >
        <FolderKanban className="size-6" aria-hidden />
      </span>
      <p className="text-sm text-muted-foreground">
        まだ Plan や Task がありません。Inbox Zero でキャプチャを確定すると、
        ここに道筋とタスクが並びます。
      </p>
      <Link
        href="/inbox"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Inbox Zero へ
      </Link>
    </div>
  );
}

function ResultCard({ result }: { result: ProjectResult }) {
  const detail = result.detail ?? {};
  const created = result.createdAt
    ? new Date(result.createdAt).toLocaleDateString("ja-JP")
    : "";

  return (
    <article className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {created && <span>{created}</span>}
        {result.plannedMinutes != null && (
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            見積 {result.plannedMinutes}分
          </Badge>
        )}
        {result.actualMinutes != null && (
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            実績 {result.actualMinutes}分
          </Badge>
        )}
      </div>
      {result.unexpected && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-muted-foreground">想定外</p>
          <p className="mt-1 text-sm leading-relaxed">{result.unexpected}</p>
        </div>
      )}
      {result.nextTimeChange && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-muted-foreground">
            次回変えたいこと
          </p>
          <p className="mt-1 text-sm leading-relaxed">{result.nextTimeChange}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {typeof detail.equipment === "string" && detail.equipment && (
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            機材: {detail.equipment}
          </Badge>
        )}
        {typeof detail.location === "string" && detail.location && (
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            現場: {detail.location}
          </Badge>
        )}
        {typeof detail.revisionCount === "number" && (
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            修正 {detail.revisionCount}回
          </Badge>
        )}
        {typeof detail.attendees === "string" && detail.attendees && (
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            {detail.attendees}
          </Badge>
        )}
      </div>
    </article>
  );
}

function SectionHeading({
  label,
  hint,
}: {
  label: string;
  hint?: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-semibold">{label}</h2>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function PlanGroupSection({
  group,
  index,
  updatingTaskId,
  onToggleTask,
}: {
  group: PlanGroup;
  index: number;
  updatingTaskId: string | null;
  onToggleTask: (task: ProjectTask) => void;
}) {
  const { plan, steps, tasks } = group;
  const sortedSteps = [...steps].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm md:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            phaseAccentClasses.project.step
          )}
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">Plan（道筋）</p>
          <h3 className="font-semibold leading-snug">{plan.title}</h3>
          {plan.goal && plan.goal !== plan.title && (
            <p className="mt-1 text-sm text-muted-foreground">{plan.goal}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {plan.dueDate && (
              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                期限: {formatDueDateDisplay(plan.dueDate)}
              </Badge>
            )}
            {plan.context && (
              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                {plan.context}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {sortedSteps.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            Steps（順番）
          </p>
          <ol className="space-y-2">
            {sortedSteps.map((step, i) => (
              <li key={step.id} className="flex gap-3 text-sm">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                    phaseAccentClasses.organize.step
                  )}
                >
                  {i + 1}
                </span>
                <span className="pt-0.5 leading-relaxed">{step.content}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          Tasks（実行項目）
        </p>
        {tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
            この Plan にタスクはまだありません
          </p>
        ) : (
          <TaskList
            tasks={tasks}
            updatingTaskId={updatingTaskId}
            onToggle={onToggleTask}
          />
        )}
      </div>
    </section>
  );
}

function TaskList({
  tasks,
  updatingTaskId,
  onToggle,
}: {
  tasks: ProjectTask[];
  updatingTaskId: string | null;
  onToggle: (task: ProjectTask) => void;
}) {
  const ordered = [...tasks].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    return 0;
  });

  return (
    <ul className="space-y-2">
      {ordered.map((task) => {
        const done = task.status === "done";
        const busy = updatingTaskId === task.id;

        return (
          <li key={task.id}>
            <div
              className={cn(
                "flex items-start gap-3 rounded-lg border bg-background px-3 py-3",
                done && "opacity-70"
              )}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-0.5 size-8 shrink-0"
                disabled={busy}
                onClick={() => onToggle(task)}
                aria-label={done ? "未完了に戻す" : "完了にする"}
              >
                {done ? (
                  <CheckCircle2
                    className={cn("size-5", phaseAccentClasses.execute.text)}
                  />
                ) : (
                  <Circle className="size-5 text-muted-foreground" />
                )}
              </Button>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium leading-snug",
                    done && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                    {priorityLabel(task.priority)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    期限: {formatTaskDueDateShort(task.dueDate)}
                  </span>
                  {task.status === "on_hold" && (
                    <Badge className="bg-muted px-1.5 py-0 text-[10px] text-muted-foreground hover:bg-muted">
                      保留
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
