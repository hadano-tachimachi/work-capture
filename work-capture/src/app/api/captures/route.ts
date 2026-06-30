import { NextResponse } from "next/server";
import {
  confirmCaptureToTasks,
  deleteCapture,
  getCaptureWithItems,
  getInboxCapturesWithSummary,
  markReadyForReview,
  skipCapture,
  updateStructuredItems,
} from "@/lib/services/capture";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const data = await getCaptureWithItems(id);
      if (!data) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(data);
    }

    const captures = await getInboxCapturesWithSummary();
    return NextResponse.json({ captures });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { captureId, action, items, confirmData } = body;

    if (!captureId || !action) {
      return NextResponse.json(
        { error: "captureId and action are required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "ready_for_review":
        await markReadyForReview(captureId);
        break;
      case "update_items":
        await updateStructuredItems(captureId, items ?? []);
        break;
      case "confirm":
        await confirmCaptureToTasks(captureId, confirmData);
        break;
      case "skip":
        await skipCapture(captureId);
        break;
      case "delete":
        await deleteCapture(captureId);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update" },
      { status: 500 }
    );
  }
}
