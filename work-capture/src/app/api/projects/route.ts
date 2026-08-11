import { NextResponse } from "next/server";
import { listProjectSummaries } from "@/lib/services/projects";

export async function GET() {
  try {
    const projects = await listProjectSummaries();
    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch" },
      { status: 500 }
    );
  }
}
