import {
  mockStructureTranscript,
  DEV_MODEL_NAME,
} from "@/lib/ai/dev-mock";
import { PROMPT_VERSION } from "@/lib/ai/prompts";
import type { AiProvider, StructureResult } from "@/lib/ai/types";
import { ProviderNotConfiguredError } from "@/lib/ai/types";
import {
  getModelName,
  hasAnyProviderKey,
  isProviderConfigured,
} from "@/lib/ai/providers/config";
import { structureWithGemini } from "@/lib/ai/providers/gemini-provider";
import { structureWithOpenAI } from "@/lib/ai/providers/openai-provider";
import { structureWithClaude } from "@/lib/ai/providers/claude-provider";

export { PROMPT_VERSION };
export {
  listProviders,
  getDefaultProvider,
  isProviderConfigured,
  hasAnyProviderKey,
  parseAiProvider,
  getModelName,
} from "@/lib/ai/providers/config";

export async function structureTranscript(
  transcript: string,
  provider: AiProvider
): Promise<StructureResult> {
  if (!isProviderConfigured(provider)) {
    if (process.env.NODE_ENV === "development" && !hasAnyProviderKey()) {
      const mock = await mockStructureTranscript(transcript);
      return { ...mock, modelName: DEV_MODEL_NAME };
    }
    throw new ProviderNotConfiguredError(provider);
  }

  switch (provider) {
    case "gemini":
      return structureWithGemini(transcript);
    case "openai":
      return structureWithOpenAI(transcript);
    case "claude":
      return structureWithClaude(transcript);
  }
}

export function getActiveModelName(provider: AiProvider): string {
  if (!isProviderConfigured(provider)) {
    if (process.env.NODE_ENV === "development" && !hasAnyProviderKey()) {
      return DEV_MODEL_NAME;
    }
    return `${provider} (未設定)`;
  }
  return getModelName(provider);
}

export { transcribeWithGemini } from "@/lib/ai/providers/gemini-provider";
