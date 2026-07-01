import type { StructureResult } from "@/lib/ai/types";
import { STRUCTURE_JSON_SCHEMA } from "@/lib/ai/structure-json-schema";
import { parseApiErrorMessage } from "@/lib/ai/api-errors";
import {
  STRUCTURE_USER_PROMPT,
  SYSTEM_PROMPT,
} from "@/lib/ai/prompts";
import { getModelName } from "@/lib/ai/providers/config";

const MODEL = getModelName("openai");

export async function structureWithOpenAI(
  transcript: string
): Promise<StructureResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: STRUCTURE_USER_PROMPT(transcript) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "work_capture_structure",
          strict: true,
          schema: STRUCTURE_JSON_SCHEMA,
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(parseApiErrorMessage("OpenAI", res.status, err));
  }

  const data = await res.json();
  const rawOutput = data.choices?.[0]?.message?.content ?? "";
  const parsed = JSON.parse(rawOutput);
  return { rawOutput, parsed, modelName: MODEL };
}
