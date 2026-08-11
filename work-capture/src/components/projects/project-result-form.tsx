"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { phaseAccentClasses } from "@/lib/utils/phase-colors";

export type ResultFormValues = {
  plannedMinutes: string;
  actualMinutes: string;
  unexpected: string;
  nextTimeChange: string;
  kind: string;
  equipment: string;
  location: string;
  revisionCount: string;
  attendees: string;
};

const EMPTY: ResultFormValues = {
  plannedMinutes: "",
  actualMinutes: "",
  unexpected: "",
  nextTimeChange: "",
  kind: "",
  equipment: "",
  location: "",
  revisionCount: "",
  attendees: "",
};

type ProjectResultFormProps = {
  initialKind?: string | null;
  saving?: boolean;
  onSubmit: (values: ResultFormValues) => Promise<void> | void;
  className?: string;
};

export function ProjectResultForm({
  initialKind,
  saving,
  onSubmit,
  className,
}: ProjectResultFormProps) {
  const [values, setValues] = useState<ResultFormValues>({
    ...EMPTY,
    kind: initialKind ?? "",
  });

  function update<K extends keyof ResultFormValues>(
    key: K,
    value: ResultFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(values);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "space-y-4 rounded-xl border bg-card p-4 shadow-sm",
        className
      )}
    >
      <div>
        <h3 className={cn("font-semibold", phaseAccentClasses.project.text)}>
          Result（振り返り）
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          次回の Plan に活かすための最小記録です。仕事を完了するときに一緒に残します。
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="plannedMinutes">見積時間（分）</Label>
          <Input
            id="plannedMinutes"
            inputMode="numeric"
            value={values.plannedMinutes}
            onChange={(e) => update("plannedMinutes", e.target.value)}
            placeholder="例: 180"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="actualMinutes">実時間（分）</Label>
          <Input
            id="actualMinutes"
            inputMode="numeric"
            value={values.actualMinutes}
            onChange={(e) => update("actualMinutes", e.target.value)}
            placeholder="例: 240"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="kind">仕事の種類</Label>
        <select
          id="kind"
          value={values.kind}
          onChange={(e) => update("kind", e.target.value)}
          className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">種類を選ぶ（Learn用）</option>
          <option value="photography">撮影</option>
          <option value="website">Web制作</option>
          <option value="meeting">打合せ</option>
          <option value="personal">個人</option>
        </select>
      </div>

      {values.kind === "photography" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="equipment">使用機材</Label>
            <Input
              id="equipment"
              value={values.equipment}
              onChange={(e) => update("equipment", e.target.value)}
              placeholder="例: α7IV + 35mm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">現場</Label>
            <Input
              id="location"
              value={values.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="例: スタジオA"
            />
          </div>
        </div>
      )}

      {values.kind === "website" && (
        <div className="space-y-1.5">
          <Label htmlFor="revisionCount">修正回数</Label>
          <Input
            id="revisionCount"
            inputMode="numeric"
            value={values.revisionCount}
            onChange={(e) => update("revisionCount", e.target.value)}
            placeholder="例: 2"
          />
        </div>
      )}

      {values.kind === "meeting" && (
        <div className="space-y-1.5">
          <Label htmlFor="attendees">参加者メモ</Label>
          <Input
            id="attendees"
            value={values.attendees}
            onChange={(e) => update("attendees", e.target.value)}
            placeholder="例: クライアント2名 + 自分"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="unexpected">想定外だったこと</Label>
        <Textarea
          id="unexpected"
          value={values.unexpected}
          onChange={(e) => update("unexpected", e.target.value)}
          rows={3}
          placeholder="予定になかった出来事・詰まり"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nextTimeChange">次回変えたいこと</Label>
        <Textarea
          id="nextTimeChange"
          value={values.nextTimeChange}
          onChange={(e) => update("nextTimeChange", e.target.value)}
          rows={3}
          placeholder="次に同じ種類の仕事をするとき変えたいこと"
        />
      </div>

      <Button type="submit" disabled={saving} className="w-full sm:w-auto">
        {saving ? "保存中…" : "Resultを残して仕事を完了する"}
      </Button>
    </form>
  );
}
