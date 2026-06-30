import { NextResponse } from "next/server";
import { getDbMode, isDevFallback } from "@/lib/db";
import { isUsingDevMock } from "@/lib/ai/dev-mock";

export async function GET() {
  return NextResponse.json({
    ok: true,
    dbMode: getDbMode(),
    devFallback: isDevFallback(),
    aiMock: isUsingDevMock(),
    message: isDevFallback()
      ? "開発モード: DATABASE_URL または GEMINI_API_KEY 未設定時はローカルDB/モックAIを使用しています"
      : "本番モード: Neon + Gemini を使用中",
  });
}
