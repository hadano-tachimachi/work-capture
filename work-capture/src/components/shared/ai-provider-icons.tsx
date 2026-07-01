"use client";

import type { AiProvider } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

/** Simple Icons（jsDelivr）— ブランド SVG */
const PROVIDER_ICONS: Record<
  AiProvider,
  { src: string; alt: string; darkInvert?: boolean }
> = {
  gemini: {
    src: "https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/googlegemini.svg",
    alt: "Gemini",
  },
  openai: {
    src: "https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/openai.svg",
    alt: "OpenAI",
    darkInvert: true,
  },
  claude: {
    src: "https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/anthropic.svg",
    alt: "Claude",
  },
};

export function AiProviderIcon({
  provider,
  className,
  size = 20,
}: {
  provider: AiProvider;
  className?: string;
  size?: number;
}) {
  const icon = PROVIDER_ICONS[provider];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={icon.src}
      alt={icon.alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={cn(
        "shrink-0 object-contain",
        icon.darkInvert && "dark:invert",
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}
