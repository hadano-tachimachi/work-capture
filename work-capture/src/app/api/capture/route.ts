import { NextResponse } from "next/server";
import {
  processAudioCapture,
  processTextCapture,
} from "@/lib/services/capture";
import {
  getDefaultProvider,
  parseAiProvider,
} from "@/lib/ai/providers";
import { ProviderNotConfiguredError } from "@/lib/ai/types";

function resolveProvider(body: Record<string, unknown>) {
  return parseAiProvider(body.provider) ?? getDefaultProvider();
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      const text = body.text?.trim();
      if (!text) {
        return NextResponse.json({ error: "text is required" }, { status: 400 });
      }
      const provider = resolveProvider(body);
      const result = await processTextCapture(text, { provider });
      return NextResponse.json(result);
    }

    const formData = await request.formData();
    const audio = formData.get("audio");
    const mimeType = (formData.get("mimeType") as string) || "audio/webm";
    const browserTranscript = (formData.get("transcript") as string) || "";
    const provider =
      parseAiProvider(formData.get("provider")) ?? getDefaultProvider();

    let audioBase64: string | undefined;
    if (audio instanceof Blob && audio.size > 0) {
      const buffer = Buffer.from(await audio.arrayBuffer());
      audioBase64 = buffer.toString("base64");
    }

    if (!browserTranscript.trim() && !audioBase64) {
      return NextResponse.json(
        { error: "transcript or audio is required" },
        { status: 400 }
      );
    }

    const result = await processAudioCapture(
      { browserTranscript, audioBase64, mimeType },
      { provider }
    );
    return NextResponse.json(result);
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
    console.error("Capture error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process capture",
      },
      { status: 500 }
    );
  }
}
