import { NextRequest, NextResponse } from "next/server";
import { createJob, updateJobStatus } from "@/lib/db";
import { calculateCost } from "@/lib/pricing";
import type { ColorMode, PrintJob, Urgency } from "@/lib/types";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

function mockUpiReference(): string {
  const digits = Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 10),
  ).join("");
  return `UPI${digits}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      studentName,
      fileName,
      pageCount,
      copies,
      colorMode,
      duplex,
      urgency,
    } = body;

    if (!studentName || !fileName || !pageCount) {
      return NextResponse.json(
        { error: "Missing required job fields" },
        { status: 400 },
      );
    }

    const costInRupees = calculateCost({
      pageCount: Number(pageCount),
      copies: Number(copies) || 1,
      colorMode: (colorMode as ColorMode) || "bw",
      duplex: duplex ?? true,
      urgency: (urgency as Urgency) || "standard",
    });

    const upiReference = mockUpiReference();
    const id = randomUUID();

    const job: PrintJob = {
      id,
      studentName,
      fileName,
      pageCount: Number(pageCount),
      copies: Number(copies) || 1,
      colorMode: (colorMode as ColorMode) || "bw",
      duplex: duplex ?? true,
      urgency: (urgency as Urgency) || "standard",
      costInRupees,
      status: "pending_payment",
      createdAt: new Date().toISOString(),
      upiReference,
    };

    createJob(job);

    // Return the created job and payment info. Do NOT auto-queue —
    // caller should redirect user to a payment flow and update status
    // once payment succeeds.
    return NextResponse.json({ job, upiReference, costInRupees });
  } catch (error) {
    console.error("Confirm error:", error);
    return NextResponse.json(
      { error: "Failed to confirm job" },
      { status: 500 },
    );
  }
}
