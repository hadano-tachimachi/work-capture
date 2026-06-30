import { eq, inArray } from "drizzle-orm";
import {
  getActiveModelName,
  PROMPT_VERSION,
  structureTranscript,
  transcribeAudio,
} from "@/lib/ai/gemini";
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

export async function processTextCapture(
  text: string
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

  return processStructure(capture.id, text);
}

export async function processAudioCapture(
  audioBase64: string,
  mimeType: string
): Promise<ProcessCaptureResult> {
  const db = getDb();
  const { workCaptures } = getTables();

  const [capture] = await db
    .insert(workCaptures)
    .values({
      inputType: "audio",
      status: "transcribed",
    })
    .returning();

  const transcript = await transcribeAudio(audioBase64, mimeType);

  await db
    .update(workCaptures)
    .set({ transcriptText: transcript, status: "transcribed" })
    .where(eq(workCaptures.id, capture.id));

  return processStructure(capture.id, transcript);
}

async function processStructure(
  captureId: string,
  transcript: string
): Promise<ProcessCaptureResult> {
  const db = getDb();
  const { workCaptures, structuredItems, aiParseResults } = getTables();

  let rawOutput = "";
  let parsed: unknown = null;
  let validationStatus = "failed";
  let validationErrors: unknown = null;

  try {
    const result = await structureTranscript(transcript);
    rawOutput = result.rawOutput;
    parsed = result.parsed;

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
    modelName: getActiveModelName(),
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
