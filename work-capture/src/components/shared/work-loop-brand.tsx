import { cn } from "@/lib/utils";

type WorkLoopBrandProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: {
    mark: "size-7 rounded-lg",
    text: "text-lg",
  },
  md: {
    mark: "size-8 rounded-[0.6rem]",
    text: "text-xl",
  },
  lg: {
    mark: "size-10 rounded-xl",
    text: "text-2xl",
  },
};

export function WorkLoopBrand({
  size = "md",
  className,
}: WorkLoopBrandProps) {
  const styles = sizes[size];

  return (
    <span
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label="Work Loop"
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center bg-gradient-to-br from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] shadow-sm shadow-primary/20",
          styles.mark
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 32 32" className="size-[72%]" fill="none">
          <path
            d="M16 10.2c-2.1 0-3.8 1.7-3.8 3.8v4.2c0 2.1 1.7 3.8 3.8 3.8s3.8-1.7 3.8-3.8V14c0-2.1-1.7-3.8-3.8-3.8Z"
            stroke="white"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <path
            d="M9.7 17.7v.8a6.3 6.3 0 0 0 12.6 0v-.8M16 24.8v2.5"
            stroke="white"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <path
            d="M24.3 9.8a10.8 10.8 0 1 0 2.1 11.9M24 7.4l.5 3.3-3.3-.5"
            stroke="white"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span
        className={cn(
          "font-bold leading-none tracking-[-0.035em]",
          styles.text
        )}
        aria-hidden="true"
      >
        <span className="text-foreground">Work</span>{" "}
        <span className="bg-gradient-to-r from-primary to-[var(--gradient-primary-to)] bg-clip-text text-transparent">
          Loop
        </span>
      </span>
    </span>
  );
}
