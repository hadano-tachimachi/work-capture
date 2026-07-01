/** Capture → Organize → Execute のフェーズ別アクセント */
export type PhaseAccent = "capture" | "organize" | "execute";

export const phaseAccentClasses: Record<
  PhaseAccent,
  {
    step: string;
    icon: string;
    badge: string;
    badgeSoft: string;
    border: string;
    text: string;
    navActive: string;
  }
> = {
  capture: {
    step: "bg-primary/15 text-primary",
    icon: "bg-primary/15 text-primary",
    badge: "bg-primary text-primary-foreground hover:bg-primary",
    badgeSoft: "bg-primary/15 text-primary hover:bg-primary/15",
    border: "border-l-primary border-primary/40",
    text: "text-primary",
    navActive: "bg-primary/10 text-primary shadow-sm",
  },
  organize: {
    step: "bg-secondary text-secondary-foreground",
    icon: "bg-secondary text-secondary-foreground",
    badge: "bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90",
    badgeSoft: "bg-secondary text-secondary-foreground hover:bg-secondary",
    border: "border-l-secondary-foreground border-secondary-foreground/30",
    text: "text-secondary-foreground",
    navActive: "bg-secondary text-secondary-foreground shadow-sm",
  },
  execute: {
    step: "bg-tertiary-muted text-tertiary-muted-foreground",
    icon: "bg-tertiary-muted text-tertiary-muted-foreground",
    badge: "bg-tertiary text-tertiary-foreground hover:bg-tertiary/90",
    badgeSoft:
      "bg-tertiary-muted text-tertiary-muted-foreground hover:bg-tertiary-muted",
    border: "border-l-tertiary border-tertiary/40",
    text: "text-tertiary-muted-foreground",
    navActive: "bg-tertiary-muted text-tertiary-muted-foreground shadow-sm",
  },
};
