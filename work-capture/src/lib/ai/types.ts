export const AI_PROVIDERS = ["gemini", "openai", "claude"] as const;

export type AiProvider = (typeof AI_PROVIDERS)[number];

export type StructureResult = {
  rawOutput: string;
  parsed: unknown;
  modelName: string;
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
