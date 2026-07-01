import { NextResponse } from "next/server";
import {
  getDefaultProvider,
  listProviders,
} from "@/lib/ai/providers";

export async function GET() {
  const providers = listProviders();
  return NextResponse.json({
    providers,
    default: getDefaultProvider(),
  });
}
