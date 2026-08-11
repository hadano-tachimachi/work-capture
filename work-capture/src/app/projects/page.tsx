"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderKanban, Menu, Mic } from "lucide-react";
import {
  ProjectCard,
  type ProjectCardData,
} from "@/components/projects/project-card";
import { PcWorkHeader } from "@/components/shared/pc-work-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { phaseAccentClasses } from "@/lib/utils/phase-colors";
import { isActiveProjectStatus } from "@/lib/utils/project-display";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [inboxCount, setInboxCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [projectsRes, inboxRes, taskRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/inbox/count"),
        fetch("/api/tasks/count"),
      ]);
      const projectsData = await projectsRes.json();
      const inboxData = await inboxRes.json();
      const taskData = await taskRes.json();
      if (cancelled) return;

      setProjects(projectsData.projects ?? []);
      setInboxCount(inboxData.count ?? 0);
      setTaskCount(taskData.todo ?? 0);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeProjects = projects.filter((p) => isActiveProjectStatus(p.status));
  const closedProjects = projects.filter(
    (p) => !isActiveProjectStatus(p.status)
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
      <header className="flex items-center justify-between border-b px-4 py-3 md:hidden">
        <Link
          href="/capture/menu"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          aria-label="メニュー"
        >
          <Menu className="size-5" />
        </Link>
        <span
          className={cn("text-sm font-semibold", phaseAccentClasses.project.text)}
        >
          仕事（Projects）
        </span>
        <Link
          href="/capture"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          aria-label="録音画面へ"
        >
          <Mic className="size-5" />
        </Link>
      </header>

      <div className="hidden md:block">
        <PcWorkHeader
          mode="projects"
          inboxCount={inboxCount}
          projectCount={activeProjects.length}
          taskCount={taskCount}
          trailing={
            activeProjects.length > 0 ? (
              <span className={cn("text-sm", phaseAccentClasses.project.text)}>
                進行中 {activeProjects.length} 件
              </span>
            ) : undefined
          }
        />
      </div>

      <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mx-auto w-full max-w-5xl space-y-8">
            <section>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                進行中の仕事（{activeProjects.length}）
              </h2>
              {activeProjects.length === 0 ? (
                <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  進行中の仕事はありません
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {activeProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </section>

            {closedProjects.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                  終わった仕事（{closedProjects.length}）
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {closedProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <p className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
        話した内容は Plan（道筋）になり、その Plan がこの仕事に集まります
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <span
        className={cn(
          "flex size-14 items-center justify-center rounded-full",
          phaseAccentClasses.project.icon
        )}
      >
        <FolderKanban className="size-7" aria-hidden />
      </span>
      <div>
        <p className="font-semibold">まだ仕事がありません</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Inbox Zero でキャプチャを確定するとき、仕事の名前を入れると
          ここに仕事の器ができます。
        </p>
      </div>
      <Link href="/inbox" className={cn(buttonVariants({ variant: "outline" }))}>
        Inbox Zero へ
      </Link>
    </div>
  );
}
