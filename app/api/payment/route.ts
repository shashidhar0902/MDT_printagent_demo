import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJobStatus } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, method, details } = body;

    if (!id || !method) {
      return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
    }

    const job = getJob(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "pending_payment") {
      return NextResponse.json({ error: "Job not pending payment" }, { status: 400 });
    }

    // Simulate payment processing. In a real app integrate a payment gateway.
    const succeeded = true; // for demo, always succeed

    if (succeeded) {
      const updated = updateJobStatus(id, "queued");
      return NextResponse.json({ success: true, job: updated });
    }

    return NextResponse.json({ success: false, error: "Payment failed" }, { status: 402 });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 });
  }
}
