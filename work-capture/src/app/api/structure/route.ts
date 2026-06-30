import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import {
  getActiveModelName,
  PROMPT_VERSION,
  structureTranscript,
} from "@/lib/ai/gemini";
import { getDb, getTables } from "@/lib/db";
import {
  structuredOutputSchema,
  structuredOutputToItems,
} from "@/lib/validation/structure-schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { captureId, transcript } = body;

    if (!captureId || !transcript?.trim()) {
      return NextResponse.json(
        { error: "captureId and transcript are required" },
        { status: 400 }
      );
    }

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
        await db
          .delete(structuredItems)
          .where(eq(structuredItems.workCaptureId, captureId));

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

    const status =
      validationStatus === "passed" ? "ready_for_review" : "validation_failed";

    await db
      .update(workCaptures)
      .set({ transcriptText: transcript, status })
      .where(eq(workCaptures.id, captureId));

    return NextResponse.json({
      captureId,
      status,
      validationStatus,
      validationErrors,
      parsed,
    });
  } catch (error) {
    console.error("Structure error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to structure content",
      },
      { status: 500 }
    );
  }
}
