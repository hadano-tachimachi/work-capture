import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import {
  isUsingDevMock,
  mockStructureTranscript,
  mockTranscribeAudio,
  DEV_MODEL_NAME,
} from "./dev-mock";
import {
  PROMPT_VERSION,
  STRUCTURE_USER_PROMPT,
  SYSTEM_PROMPT,
  TRANSCRIBE_PROMPT,
} from "./prompts";

const MODEL_NAME = "gemini-2.0-flash";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function transcribeAudio(
  audioBase64: string,
  mimeType: string
): Promise<string> {
  if (isUsingDevMock()) {
    void audioBase64;
    void mimeType;
    return mockTranscribeAudio();
  }

  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const result = await model.generateContent([
    {
      inlineData: {
        data: audioBase64,
        mimeType,
      },
    },
    { text: TRANSCRIBE_PROMPT },
  ]);

  return result.response.text().trim();
}

export async function structureTranscript(
  transcript: string
): Promise<{ rawOutput: string; parsed: unknown }> {
  if (isUsingDevMock()) {
    return mockStructureTranscript(transcript);
  }

  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
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

  const result = await model.generateContent(
    STRUCTURE_USER_PROMPT(transcript)
  );
  const rawOutput = result.response.text();
  const parsed = JSON.parse(rawOutput);
  return { rawOutput, parsed };
}

export function getActiveModelName(): string {
  return isUsingDevMock() ? DEV_MODEL_NAME : MODEL_NAME;
}

export { PROMPT_VERSION };
