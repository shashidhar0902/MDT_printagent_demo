import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { extractPrintSpec } from "@/lib/anthropic";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const instructions = (formData.get("instructions") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Please upload a PDF file" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    let pageCount: number;

    try {
      const pdf = await PDFDocument.load(bytes);
      pageCount = pdf.getPageCount();
    } catch {
      return NextResponse.json(
        { error: "Could not read PDF. Make sure the file is not corrupted." },
        { status: 400 },
      );
    }

    const spec = await extractPrintSpec(instructions);

    return NextResponse.json({
      pageCount,
      spec,
      fileName: file.name,
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to parse instructions. Try rephrasing or edit the fields manually.",
      },
      { status: 500 },
    );
  }
}
