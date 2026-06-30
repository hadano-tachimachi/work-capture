"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  label: string;
  preview?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  interactive?: boolean;
  variant?: "default" | "warning";
};

export function SectionCard({
  label,
  preview,
  onClick,
  className,
  interactive = true,
  variant = "default",
}: SectionCardProps) {
  const Wrapper = interactive && onClick ? "button" : "div";

  return (
    <Wrapper
      type={interactive && onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border bg-card p-4 text-left shadow-sm transition-colors",
        variant === "warning" &&
          "border-amber-500/50 bg-amber-500/5",
        interactive && onClick && "hover:bg-capture-surface active:bg-capture-surface",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <div className="text-sm text-foreground">{preview ?? "—"}</div>
        </div>
        {interactive && onClick && (
          <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        )}
      </div>
    </Wrapper>
  );
}
