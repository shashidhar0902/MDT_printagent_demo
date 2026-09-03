import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJobStatus } from "@/lib/db";
import type { JobStatus } from "@/lib/types";

export const runtime = "nodejs";

const allowedTransitions: Record<JobStatus, JobStatus[]> = {
  pending_payment: ["cancelled"],
  queued: ["printing", "cancelled"],
  printing: ["ready", "cancelled"],
  ready: ["collected", "cancelled"],
  collected: [],
  cancelled: [],
};

export async function POST(request: NextRequest) {
  try {
    const { id, status } = await request.json() as { id?: string; status?: JobStatus };
    if (!id || !status || !Object.prototype.hasOwnProperty.call(allowedTransitions, status)) {
      return NextResponse.json({ error: "Valid job id and status are required" }, { status: 400 });
    }

    const job = getJob(id);
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (!allowedTransitions[job.status].includes(status)) {
      return NextResponse.json({ error: `Cannot move ${job.status} to ${status}` }, { status: 409 });
    }

    const updated = updateJobStatus(id, status);
    return NextResponse.json({ job: updated });
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}