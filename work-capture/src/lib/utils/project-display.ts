const KIND_LABELS: Record<string, string> = {
  photography: "撮影",
  website: "Web制作",
  meeting: "打合せ",
  personal: "個人",
};

export function projectKindLabel(kind: string | null | undefined): string | null {
  if (!kind?.trim()) return null;
  return KIND_LABELS[kind] ?? kind;
}

export function projectStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "done":
      return "完了";
    case "archived":
      return "保管";
    default:
      return "進行中";
  }
}

export function isActiveProjectStatus(status: string | null | undefined): boolean {
  return status !== "done" && status !== "archived";
}
