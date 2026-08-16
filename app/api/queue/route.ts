import { NextResponse } from "next/server";
import { getQueue } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const jobs = getQueue();
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Queue error:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue" },
      { status: 500 },
    );
  }
}
