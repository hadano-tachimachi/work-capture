"use client";

import { useCallback, useEffect, useState } from "react";
import type { AiProvider, ProviderInfo } from "@/lib/ai/types";

const STORAGE_KEY = "wc-ai-provider";

export function useAiProvider() {
  const [provider, setProviderState] = useState<AiProvider>("gemini");
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as AiProvider | null;
    if (stored === "gemini" || stored === "openai" || stored === "claude") {
      setProviderState(stored);
    }

    fetch("/api/ai/providers")
      .then((r) => r.json())
      .then((data) => {
        const list: ProviderInfo[] = data.providers ?? [];
        setProviders(list);
        const defaultProvider: AiProvider = data.default ?? "gemini";
        if (!stored) {
          setProviderState(defaultProvider);
        } else if (!list.find((p) => p.id === stored)?.configured) {
          const firstConfigured = list.find((p) => p.configured);
          if (firstConfigured) setProviderState(firstConfigured.id);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const setProvider = useCallback((next: AiProvider) => {
    setProviderState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const selectedInfo = providers.find((p) => p.id === provider);

  return {
    provider,
    setProvider,
    providers,
    selectedInfo,
    loaded,
    isSelectedConfigured: selectedInfo?.configured ?? false,
  };
}
