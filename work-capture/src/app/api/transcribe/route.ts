import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/ai/gemini";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");
    const mimeType = (formData.get("mimeType") as string) || "audio/webm";

    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: "audio is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await audio.arrayBuffer());
    const transcript = await transcribeAudio(
      buffer.toString("base64"),
      mimeType
    );

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("Transcribe error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to transcribe audio",
      },
      { status: 500 }
    );
  }
}
