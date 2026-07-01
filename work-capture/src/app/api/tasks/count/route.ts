import { NextResponse } from "next/server";
import { getTaskCounts } from "@/lib/services/tasks";

export async function GET() {
  try {
    const counts = await getTaskCounts();
    return NextResponse.json(counts);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
