import {
  mockStructureTranscript,
  DEV_MODEL_NAME,
} from "@/lib/ai/dev-mock";
import {
  buildLearnPromptSection,
  formatLearnReferenceLine,
  loadLearnReferences,
} from "@/lib/ai/learn-context";
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
  provider: AiProvider,
  options?: { kindHint?: string | null }
): Promise<StructureResult> {
  const { kind, references } = await loadLearnReferences(
    transcript,
    options?.kindHint
  );
  const learnSection = buildLearnPromptSection(references);
  const learnMeta = {
    learnKind: kind,
    learnReferences: references.map((ref) => ({
      projectId: ref.projectId,
      projectTitle: ref.projectTitle,
      line: formatLearnReferenceLine(ref),
    })),
  };

  if (!isProviderConfigured(provider)) {
    if (process.env.NODE_ENV === "development" && !hasAnyProviderKey()) {
      const mock = await mockStructureTranscript(transcript);
      return { ...mock, modelName: DEV_MODEL_NAME, ...learnMeta };
    }
    throw new ProviderNotConfiguredError(provider);
  }

  let result: StructureResult;
  switch (provider) {
    case "gemini":
      result = await structureWithGemini(transcript, learnSection);
      break;
    case "openai":
      result = await structureWithOpenAI(transcript, learnSection);
      break;
    case "claude":
      result = await structureWithClaude(transcript, learnSection);
      break;
  }

  return { ...result, ...learnMeta };
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
