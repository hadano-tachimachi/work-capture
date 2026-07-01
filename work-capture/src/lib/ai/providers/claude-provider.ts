import type { StructureResult } from "@/lib/ai/types";
import {
  CLAUDE_TOOL_SCHEMA,
  normalizeStructuredOutput,
  parseApiErrorMessage,
} from "@/lib/ai/api-errors";
import {
  STRUCTURE_USER_PROMPT,
  SYSTEM_PROMPT,
} from "@/lib/ai/prompts";
import { getModelName } from "@/lib/ai/providers/config";

const MODEL = getModelName("claude");

export async function structureWithClaude(
  transcript: string
): Promise<StructureResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: [
        {
          name: "structure_work_capture",
          description: "文字起こしを Work Capture 形式の JSON に構造化する",
          input_schema: CLAUDE_TOOL_SCHEMA,
        },
      ],
      tool_choice: { type: "tool", name: "structure_work_capture" },
      messages: [
        {
          role: "user",
          content: STRUCTURE_USER_PROMPT(transcript),
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(parseApiErrorMessage("Claude", res.status, err));
  }

  const data = await res.json();
  const toolBlock = data.content?.find(
    (block: { type: string }) => block.type === "tool_use"
  );
  const parsed = normalizeStructuredOutput(
    (toolBlock?.input as Record<string, unknown>) ?? {}
  );
  const rawOutput = JSON.stringify(parsed, null, 2);
  return { rawOutput, parsed, modelName: MODEL };
}
