import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { StructureResult } from "@/lib/ai/types";
import { parseApiErrorMessage } from "@/lib/ai/api-errors";
import {
  STRUCTURE_USER_PROMPT,
  SYSTEM_PROMPT,
  TRANSCRIBE_PROMPT,
} from "@/lib/ai/prompts";
import { getModelName } from "@/lib/ai/providers/config";

const MODEL = getModelName("gemini");

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenerativeAI(apiKey);
}

export async function transcribeWithGemini(
  audioBase64: string,
  mimeType: string
): Promise<string> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: MODEL });

  const result = await model.generateContent([
    { inlineData: { data: audioBase64, mimeType } },
    { text: TRANSCRIBE_PROMPT },
  ]);

  return result.response.text().trim();
}

export async function structureWithGemini(
  transcript: string
): Promise<StructureResult> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          purpose: { type: SchemaType.STRING, nullable: true },
          background: { type: SchemaType.STRING, nullable: true },
          tasks: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          due_date: { type: SchemaType.STRING, nullable: true },
          action_plan: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          notes: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          decisions: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          next_action: { type: SchemaType.STRING, nullable: true },
          uncertainties: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          project_candidates: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          context_candidates: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: [
          "purpose",
          "background",
          "tasks",
          "due_date",
          "action_plan",
          "notes",
          "decisions",
          "next_action",
          "uncertainties",
          "project_candidates",
          "context_candidates",
        ],
      },
    },
  });

  try {
    const result = await model.generateContent(
      STRUCTURE_USER_PROMPT(transcript)
    );
    const rawOutput = result.response.text();
    const parsed = JSON.parse(rawOutput);
    return { rawOutput, parsed, modelName: MODEL };
  } catch (error) {
    const status =
      error && typeof error === "object" && "status" in error
        ? Number((error as { status: number }).status)
        : 500;
    const message =
      error instanceof Error ? error.message : "Unknown Gemini error";
    throw new Error(parseApiErrorMessage("Gemini", status, message));
  }
}
