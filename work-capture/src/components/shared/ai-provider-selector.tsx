"use client";

import type { AiProvider, ProviderInfo } from "@/lib/ai/types";
import { AiProviderIcon } from "@/components/shared/ai-provider-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type AiProviderSelectorProps = {
  provider: AiProvider;
  providers: ProviderInfo[];
  onChange: (provider: AiProvider) => void;
  showHint?: boolean;
  className?: string;
};

function ProviderOption({
  item,
  showModel = false,
}: {
  item: ProviderInfo;
  showModel?: boolean;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <AiProviderIcon provider={item.id} size={18} />
      <span className="truncate font-medium">{item.label}</span>
      {showModel && (
        <span className="truncate text-xs text-muted-foreground">
          {item.model}
        </span>
      )}
      {!item.configured ? (
        <span className="shrink-0 text-[10px] text-muted-foreground">
          未設定
        </span>
      ) : (
        <span className="shrink-0 text-[10px] text-primary">利用可能</span>
      )}
    </span>
  );
}

export function AiProviderSelector({
  provider,
  providers,
  onChange,
  showHint = false,
  className,
}: AiProviderSelectorProps) {
  const selected = providers.find((p) => p.id === provider);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs text-muted-foreground">AI</span>
        <Select
          value={provider}
          onValueChange={(value) => {
            if (value === "gemini" || value === "openai" || value === "claude") {
              onChange(value);
            }
          }}
        >
          <SelectTrigger className="h-9 w-full min-w-0 flex-1">
            <SelectValue>
              {selected ? (
                <ProviderOption item={selected} />
              ) : (
                <span className="text-muted-foreground">選択…</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            {providers.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                <ProviderOption item={item} showModel={showHint} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showHint && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          未設定のプロバイダーは、本番環境で API キーを追加すると利用できます。
        </p>
      )}
    </div>
  );
}
