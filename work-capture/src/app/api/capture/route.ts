import { NextResponse } from "next/server";
import {
  processAudioCapture,
  processTextCapture,
} from "@/lib/services/capture";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      const text = body.text?.trim();
      if (!text) {
        return NextResponse.json({ error: "text is required" }, { status: 400 });
      }
      const result = await processTextCapture(text);
      return NextResponse.json(result);
    }

    const formData = await request.formData();
    const audio = formData.get("audio");
    const mimeType = (formData.get("mimeType") as string) || "audio/webm";

    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: "audio is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await audio.arrayBuffer());
    const audioBase64 = buffer.toString("base64");
    const result = await processAudioCapture(audioBase64, mimeType);
    return NextResponse.json(result);
  } catch (error) {
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
