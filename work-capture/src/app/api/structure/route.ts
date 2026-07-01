import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import {
  getActiveModelName,
  getDefaultProvider,
  parseAiProvider,
  PROMPT_VERSION,
  structureTranscript,
} from "@/lib/ai/providers";
import { ProviderNotConfiguredError } from "@/lib/ai/types";
import { getDb, getTables } from "@/lib/db";
import {
  structuredOutputSchema,
  structuredOutputToItems,
} from "@/lib/validation/structure-schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { captureId, transcript, provider: providerRaw } = body;
    const provider = parseAiProvider(providerRaw) ?? getDefaultProvider();

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

    let modelName = getActiveModelName(provider);

    try {
      const result = await structureTranscript(transcript, provider);
      rawOutput = result.rawOutput;
      parsed = result.parsed;
      modelName = result.modelName;

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
      if (error instanceof ProviderNotConfiguredError) throw error;
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
    if (error instanceof ProviderNotConfiguredError) {
      return NextResponse.json(
        {
          error: error.message,
          provider: error.provider,
          code: "PROVIDER_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }
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
