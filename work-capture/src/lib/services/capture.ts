import { eq, inArray } from "drizzle-orm";
import { mockTranscribeAudio } from "@/lib/ai/dev-mock";
import {
  getActiveModelName,
  PROMPT_VERSION,
  structureTranscript,
  transcribeWithGemini,
  hasAnyProviderKey,
  isProviderConfigured,
} from "@/lib/ai/providers";
import type { AiProvider } from "@/lib/ai/types";
import { ProviderNotConfiguredError } from "@/lib/ai/types";
import { getDb, getTables } from "@/lib/db";
import {
  structuredOutputSchema,
  structuredOutputToItems,
} from "@/lib/validation/structure-schema";

export type ProcessCaptureResult = {
  id: string;
  status: string;
  transcriptText: string;
  validationStatus: string;
  validationErrors: unknown;
};

export type CaptureOptions = {
  provider: AiProvider;
};

async function resolveTranscriptFromAudio(
  browserTranscript: string | undefined,
  audioBase64: string | undefined,
  mimeType: string
): Promise<string> {
  const trimmed = browserTranscript?.trim();
  if (trimmed) return trimmed;

  if (audioBase64 && isProviderConfigured("gemini")) {
    return transcribeWithGemini(audioBase64, mimeType);
  }

  if (
    audioBase64 &&
    process.env.NODE_ENV === "development" &&
    !hasAnyProviderKey()
  ) {
    return mockTranscribeAudio();
  }

  throw new Error(
    "ブラウザの文字起こしが利用できません。Chrome / Edge をお試しいただくか、テキスト入力をご利用ください。"
  );
}

export async function processTextCapture(
  text: string,
  options: CaptureOptions
): Promise<ProcessCaptureResult> {
  const db = getDb();
  const { workCaptures } = getTables();

  const [capture] = await db
    .insert(workCaptures)
    .values({
      transcriptText: text,
      inputType: "text",
      status: "transcribed",
    })
    .returning();

  return processStructure(capture.id, text, options.provider);
}

export async function processAudioCapture(
  params: {
    browserTranscript?: string;
    audioBase64?: string;
    mimeType: string;
  },
  options: CaptureOptions
): Promise<ProcessCaptureResult> {
  const db = getDb();
  const { workCaptures } = getTables();

  const transcript = await resolveTranscriptFromAudio(
    params.browserTranscript,
    params.audioBase64,
    params.mimeType
  );

  const [capture] = await db
    .insert(workCaptures)
    .values({
      transcriptText: transcript,
      inputType: "audio",
      status: "transcribed",
    })
    .returning();

  return processStructure(capture.id, transcript, options.provider);
}

async function processStructure(
  captureId: string,
  transcript: string,
  provider: AiProvider
): Promise<ProcessCaptureResult> {
  const db = getDb();
  const { workCaptures, structuredItems, aiParseResults } = getTables();

  let rawOutput = "";
  let parsed: unknown = null;
  let validationStatus = "failed";
  let validationErrors: unknown = null;
  let modelName = getActiveModelName(provider);

  try {
    const result = await structureTranscript(transcript, provider);
    rawOutput = result.rawOutput;
    parsed = result.parsed;
    modelName = result.modelName;

    const validation = structuredOutputSchema.safeParse(parsed);
    if (validation.success) {
      validationStatus = "passed";

      const items = structuredOutputToItems(validation.data);
      if (items.length > 0) {
        await db.insert(structuredItems).values(
          items.map((item) => ({
            workCaptureId: captureId,
            type: item.type,
            content: item.content,
            sortOrder: item.sortOrder,
          }))
        );
      }
    } else {
      validationErrors = validation.error.flatten();
    }
  } catch (error) {
    if (error instanceof ProviderNotConfiguredError) {
      throw error;
    }
    validationErrors = {
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }

  await db.insert(aiParseResults).values({
    workCaptureId: captureId,
    rawOutput,
    parsedJson: parsed,
    validationStatus,
    validationErrors,
    modelName,
    promptVersion: PROMPT_VERSION,
  });

  const captureStatus =
    validationStatus === "passed" ? "ready_for_review" : "validation_failed";

  await db
    .update(workCaptures)
    .set({ status: captureStatus })
    .where(eq(workCaptures.id, captureId));

  const [updated] = await db
    .select()
    .from(workCaptures)
    .where(eq(workCaptures.id, captureId));

  return {
    id: captureId,
    status: updated.status,
    transcriptText: updated.transcriptText ?? transcript,
    validationStatus,
    validationErrors,
  };
}

export async function getCaptureWithItems(id: string) {
  const db = getDb();
  const { workCaptures, structuredItems, aiParseResults } = getTables();

  const [capture] = await db
    .select()
    .from(workCaptures)
    .where(eq(workCaptures.id, id));

  if (!capture) return null;

  const items = await db
    .select()
    .from(structuredItems)
    .where(eq(structuredItems.workCaptureId, id))
    .orderBy(structuredItems.sortOrder);

  const [parseResult] = await db
    .select()
    .from(aiParseResults)
    .where(eq(aiParseResults.workCaptureId, id))
    .limit(1);

  return { capture, items, parseResult };
}

export async function getInboxCaptures() {
  const db = getDb();
  const { workCaptures } = getTables();

  return db
    .select()
    .from(workCaptures)
    .where(
      inArray(workCaptures.status, ["ready_for_review", "validation_failed"])
    )
    .orderBy(workCaptures.createdAt);
}

export async function getInboxCapturesWithSummary() {
  const captures = await getInboxCaptures();
  if (captures.length === 0) return [];

  const db = getDb();
  const { structuredItems } = getTables();
  const ids = captures.map((c: (typeof captures)[number]) => c.id);

  const allItems = await db
    .select()
    .from(structuredItems)
    .where(inArray(structuredItems.workCaptureId, ids));

  const taskCountByCapture = new Map<string, number>();
  for (const item of allItems) {
    if (item.type === "task") {
      taskCountByCapture.set(
        item.workCaptureId,
        (taskCountByCapture.get(item.workCaptureId) ?? 0) + 1
      );
    }
  }

  return captures.map((c: (typeof captures)[number]) => ({
    ...c,
    taskCount: taskCountByCapture.get(c.id) ?? 0,
  }));
}

export async function getInboxCount() {
  const captures = await getInboxCaptures();
  return captures.length;
}

export async function markReadyForReview(captureId: string) {
  const db = getDb();
  const { workCaptures } = getTables();

  await db
    .update(workCaptures)
    .set({ status: "ready_for_review" })
    .where(eq(workCaptures.id, captureId));
}

export async function updateStructuredItems(
  captureId: string,
  items: Array<{ type: string; content: string; sortOrder: number }>
) {
  const db = getDb();
  const { structuredItems } = getTables();

  await db
    .delete(structuredItems)
    .where(eq(structuredItems.workCaptureId, captureId));

  if (items.length > 0) {
    await db.insert(structuredItems).values(
      items.map((item) => ({
        workCaptureId: captureId,
        type: item.type,
        content: item.content,
        sortOrder: item.sortOrder,
      }))
    );
  }
}

export async function confirmCaptureToTasks(
  captureId: string,
  data: {
    taskTitles: string[];
    purpose?: string;
    dueDate?: string;
    priority?: string;
    project?: string;
    context?: string;
    assignedTo?: string;
  }
) {
  const db = getDb();
  const { workCaptures, tasks } = getTables();

  const titles =
    data.taskTitles.filter((t) => t.trim()).length > 0
      ? data.taskTitles.filter((t) => t.trim())
      : [data.purpose?.trim() || "（タスク未設定）"];

  for (const title of titles) {
    await db.insert(tasks).values({
      workCaptureId: captureId,
      title,
      description: data.purpose,
      dueDate: data.dueDate,
      priority: data.priority ?? "medium",
      status: "todo",
      project: data.project,
      context: data.context,
      assignedTo: data.assignedTo ?? "自分",
    });
  }

  await db
    .update(workCaptures)
    .set({ status: "confirmed" })
    .where(eq(workCaptures.id, captureId));
}

export async function skipCapture(captureId: string) {
  const db = getDb();
  const { workCaptures } = getTables();

  await db
    .update(workCaptures)
    .set({ status: "confirmed" })
    .where(eq(workCaptures.id, captureId));
}

export async function deleteCapture(captureId: string) {
  const db = getDb();
  const { workCaptures, aiParseResults, structuredItems, tasks } = getTables();

  await db
    .delete(aiParseResults)
    .where(eq(aiParseResults.workCaptureId, captureId));
  await db
    .delete(structuredItems)
    .where(eq(structuredItems.workCaptureId, captureId));
  await db.delete(tasks).where(eq(tasks.workCaptureId, captureId));
  await db.delete(workCaptures).where(eq(workCaptures.id, captureId));
}
