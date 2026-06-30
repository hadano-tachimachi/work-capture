import { NextResponse } from "next/server";
import { getInboxCount } from "@/lib/services/capture";

export async function GET() {
  try {
    const count = await getInboxCount();
    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
