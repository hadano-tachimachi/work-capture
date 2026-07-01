import { NextResponse } from "next/server";
import { getDbMode, isDevFallback } from "@/lib/db";
import { isUsingDevMock } from "@/lib/ai/dev-mock";
import { getDefaultProvider, listProviders } from "@/lib/ai/providers";

export async function GET() {
  const providers = listProviders();
  const configured = providers.filter((p) => p.configured);

  return NextResponse.json({
    ok: true,
    dbMode: getDbMode(),
    devFallback: isDevFallback(),
    aiMock: isUsingDevMock(),
    defaultProvider: getDefaultProvider(),
    providers,
    message: isUsingDevMock()
      ? "開発モード: API キー未設定時はモック AI を使用しています"
      : configured.length > 0
        ? `AI プロバイダー: ${configured.map((p) => p.label).join(", ")} が利用可能`
        : "API キーが未設定です",
  });
}
