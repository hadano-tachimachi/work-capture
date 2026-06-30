"use client";

import { cn } from "@/lib/utils";

type StatusScreenProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
};

export function StatusScreen({
  icon,
  title,
  subtitle,
  children,
  className,
}: StatusScreenProps) {
  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col items-center justify-center px-6",
        className
      )}
    >
      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h1 className="mb-2 text-center text-xl font-semibold">{title}</h1>
      {subtitle && (
        <p className="mb-8 text-center text-sm text-muted-foreground">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}
