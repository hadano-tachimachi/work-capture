export const AI_PROVIDERS = ["gemini", "openai", "claude"] as const;

export type AiProvider = (typeof AI_PROVIDERS)[number];

export type StructureResult = {
  rawOutput: string;
  parsed: unknown;
  modelName: string;
  learnKind?: string | null;
  learnReferences?: Array<{
    projectId: string;
    projectTitle: string;
    line: string;
  }>;
};

export type ProviderInfo = {
  id: AiProvider;
  label: string;
  model: string;
  configured: boolean;
};

export class ProviderNotConfiguredError extends Error {
  constructor(public provider: AiProvider) {
    super(`${provider} の API キーが未設定です`);
    this.name = "ProviderNotConfiguredError";
  }
}
