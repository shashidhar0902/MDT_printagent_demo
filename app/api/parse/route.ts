import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { extractPrintSpec } from "@/lib/anthropic";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_PAGES_PER_ORDER,
  createPrintPlan,
} from "@/lib/agents";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const uploadedFiles = [
      ...formData.getAll("files"),
      formData.get("file"),
    ].filter((value): value is File => value instanceof File);
    const instructions = (formData.get("instructions") as string) || "";

    if (uploadedFiles.length === 0) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    if (uploadedFiles.length > 20 || instructions.length > 4000) {
      return NextResponse.json({ error: "Too many files or instructions are too long" }, { status: 400 });
    }

    const files: Array<{ fileName: string; pageCount: number }> = [];

    const totalSize = uploadedFiles.reduce((total, file) => total + file.size, 0);
    if (totalSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "The total PDF upload exceeds the 100 MB limit" }, { status: 413 });
    }

    for (const file of uploadedFiles) {
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        return NextResponse.json(
          { error: "Please upload PDF files only" },
          { status: 400 },
        );
      }

      const bytes = await file.arrayBuffer();
      let filePageCount: number;

      try {
        const pdf = await PDFDocument.load(bytes);
        filePageCount = pdf.getPageCount();
      } catch {
        return NextResponse.json(
          {
            error: `Could not read ${file.name}. Make sure the file is not corrupted.`,
          },
          { status: 400 },
        );
      }

      files.push({ fileName: file.name, pageCount: filePageCount });
    }

    const pageCount = files.reduce((total, current) => total + current.pageCount, 0);

    if (pageCount < 1 || pageCount > MAX_PAGES_PER_ORDER) {
      return NextResponse.json({ error: "An order must contain between 1 and 1,000 pages" }, { status: 400 });
    }

    const spec = await extractPrintSpec(instructions);
    const printPlan = createPrintPlan(spec);

    return NextResponse.json({
      pageCount,
      spec,
      printPlan,
      fileName:
        files.length === 1 ? files[0].fileName : `${files.length} files uploaded`,
      fileCount: files.length,
      files,
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
