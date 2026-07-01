import type { AiProvider, ProviderInfo } from "@/lib/ai/types";

export const PROVIDER_MODELS: Record<AiProvider, string> = {
  gemini: "gemini-3.1-flash-lite",
  openai: "gpt-4o-mini",
  claude: "claude-3-5-haiku-latest",
};

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  gemini: "Gemini",
  openai: "OpenAI",
  claude: "Claude",
};

export function isProviderConfigured(provider: AiProvider): boolean {
  switch (provider) {
    case "gemini":
      return !!process.env.GEMINI_API_KEY;
    case "openai":
      return !!process.env.OPENAI_API_KEY;
    case "claude":
      return !!process.env.ANTHROPIC_API_KEY;
  }
}

export function hasAnyProviderKey(): boolean {
  return (
    isProviderConfigured("gemini") ||
    isProviderConfigured("openai") ||
    isProviderConfigured("claude")
  );
}

export function getDefaultProvider(): AiProvider {
  if (isProviderConfigured("gemini")) return "gemini";
  if (isProviderConfigured("openai")) return "openai";
  if (isProviderConfigured("claude")) return "claude";
  return "gemini";
}

export function parseAiProvider(value: unknown): AiProvider | null {
  if (value === "gemini" || value === "openai" || value === "claude") {
    return value;
  }
  return null;
}

export function listProviders(): ProviderInfo[] {
  return (["gemini", "openai", "claude"] as const).map((id) => ({
    id,
    label: PROVIDER_LABELS[id],
    model: PROVIDER_MODELS[id],
    configured: isProviderConfigured(id),
  }));
}

export function getModelName(provider: AiProvider): string {
  return PROVIDER_MODELS[provider];
}
